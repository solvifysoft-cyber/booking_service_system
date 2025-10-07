import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AfriPayValidationService } from './afripay-validation.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly afriPayValidation: AfriPayValidationService,
  ) {}

  // Check provider availability and booking conflicts
  private async checkBookingAvailability(
    userId: number,
    datetime: string,
    serviceIds: number[],
  ) {
    const bookingDate = new Date(datetime);
    const bookingDay = bookingDate.toLocaleString('en-US', { weekday: 'long' });
    const bookingTime = bookingDate.toTimeString().slice(0, 5);

    // 1. Fetch provider's availabilities
    const availabilities = await this.prisma.availability.findMany({
      where: { userId },
    });

    // 2. Emergency check
    const emergency = availabilities.find(
      (a) =>
        a.emergency &&
        a.hourFrom &&
        a.duration &&
        bookingDate >= new Date(a.hourFrom) &&
        bookingDate <
          new Date(new Date(a.hourFrom).getTime() + (a.duration || 0) * 60000),
    );
    if (emergency) {
      return {
        isAvailable: false,
        unavailableReason: emergency.reason
          ? `The provider is unavailable due to emergency: ${emergency.reason}. Please choose a different time.`
          : 'The provider is unavailable due to an emergency. Please choose a different time.',
        isTimeBooked: false,
        conflictWithId: null,
      };
    }

    // 3. Unavailability check (regular unavailable)
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayIdx = days.indexOf(bookingDay);
    const unavailable = availabilities.find((a) => {
      if (!a.unavailable || a.emergency) return false;
      const fromIdx = days.indexOf(a.dayFrom);
      const toIdx = days.indexOf(a.dayTo);
      const inDayRange =
        fromIdx <= toIdx
          ? dayIdx >= fromIdx && dayIdx <= toIdx
          : dayIdx >= fromIdx || dayIdx <= toIdx;
      const inTimeRange = bookingTime >= a.hourFrom && bookingTime <= a.hourTo;
      return inDayRange && inTimeRange;
    });
    if (unavailable) {
      return {
        isAvailable: false,
        unavailableReason: unavailable.reason
          ? `The provider is unavailable at this time: ${unavailable.reason}.`
          : 'The provider is unavailable at this time. Please choose a different slot.',
        isTimeBooked: false,
        conflictWithId: null,
      };
    }

    // 4. Working hours check
    const workingAvailabilities = availabilities.filter(
      (a) =>
        !a.unavailable &&
        !a.emergency &&
        a.dayFrom &&
        a.dayTo &&
        a.hourFrom &&
        a.hourTo,
    );
    let isAllowedDay = false;
    let allowedTimeRanges: { hourFrom: string; hourTo: string }[] = [];
    workingAvailabilities.forEach((avail) => {
      const fromIdx = days.indexOf(avail.dayFrom);
      const toIdx = days.indexOf(avail.dayTo);
      let dayIndexes: number[] = [];
      if (fromIdx <= toIdx) {
        dayIndexes = Array.from(
          { length: toIdx - fromIdx + 1 },
          (_, i) => fromIdx + i,
        );
      } else {
        dayIndexes = [
          ...Array.from({ length: 7 - fromIdx }, (_, i) => fromIdx + i),
          ...Array.from({ length: toIdx + 1 }, (_, i) => i),
        ];
      }
      if (dayIndexes.includes(dayIdx)) {
        isAllowedDay = true;
        allowedTimeRanges.push({
          hourFrom: avail.hourFrom,
          hourTo: avail.hourTo,
        });
      }
    });
    if (!isAllowedDay) {
      return {
        isAvailable: false,
        unavailableReason: 'The provider does not work on this day. Please select a working day.',
        isTimeBooked: false,
        conflictWithId: null,
      };
    }
    // Check if booking time fits in any allowed time range
    const [bookingHour, bookingMinute] = bookingTime.split(':').map(Number);
    const bookingMinutes = bookingHour * 60 + bookingMinute;
    // Get service duration (max of selected services)
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    const serviceDuration = Math.max(...services.map((s) => s.duration || 60));
    const fitsInWorkingHours = allowedTimeRanges.some((range) => {
      const [startH, startM] = range.hourFrom.split(':').map(Number);
      const [endH, endM] = range.hourTo.split(':').map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      return (
        bookingMinutes >= startMinutes &&
        bookingMinutes + serviceDuration <= endMinutes
      );
    });
    if (!fitsInWorkingHours) {
      return {
        isAvailable: false,
        unavailableReason: "The selected time is outside the provider's working hours. Please choose a valid time slot.",
        isTimeBooked: false,
        conflictWithId: null,
      };
    }

    // 5. Double-booking check
    // Find all bookings for this provider on the same day
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.prisma.payment.findMany({
      where: {
        userId,
        datetime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isAvailable: true,
      },
      include: { services: true }, // <-- Add this line
    });

    const newStart = bookingDate.getTime();
    const newEnd = newStart + serviceDuration * 60000;

    const conflict = existingBookings.find((b) => {
      const bookedStart = new Date(b.datetime).getTime();
      // Get duration from service if available, else fallback to 60
      const bookedServiceIds = b.services?.map((s) => s.id) || [];
      let bookedDuration = 60;
      if (bookedServiceIds.length) {
        const bookedService = services.find((s) =>
          bookedServiceIds.includes(s.id),
        );
        bookedDuration = bookedService?.duration || 60;
      }
      const bookedEnd = bookedStart + bookedDuration * 60000;
      // Overlap check
      return newStart < bookedEnd && bookedStart < newEnd;
    });

    if (conflict) {
      return {
        isAvailable: false,
        unavailableReason:
          'This time slot is already booked by another client. Please select a different time.',
        isTimeBooked: true,
        conflictWithId: conflict.id,
      };
    }

    // All checks passed
    return {
      isAvailable: true,
      unavailableReason: null,
      isTimeBooked: false,
      conflictWithId: null,
    };
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const {
      serviceItems = [],
      foodDeliveryItems = [],
      bookingLocation,
      firstName,
      lastName,
      email,
      phoneNumber,
      datetime,
      status,
      transactionRef,
      paymentMethod,
    } = createPaymentDto;

    let userId: number | null = null;

    // If service booking
    if (serviceItems.length > 0) {
      const firstService = await this.prisma.service.findUnique({
        where: { id: serviceItems[0].id },
      });
      if (!firstService)
        throw new BadRequestException('Invalid service ID provided.');
      userId = firstService.userId;

      // Check all services belong to same provider
      const services = await this.prisma.service.findMany({
        where: { id: { in: serviceItems.map((item) => item.id) } },
      });
      const mixedProviders = services.some((s) => s.userId !== userId);
      if (mixedProviders)
        throw new BadRequestException(
          'All selected services must belong to the same provider.',
        );

      // Check availability as before...
      const bookingStatus = await this.checkBookingAvailability(
        userId,
        datetime,
        services.map((s) => s.id),
      );

      if (!bookingStatus.isAvailable) {
        throw new BadRequestException(
          bookingStatus.unavailableReason ||
            'Provider is not available at this time.',
        );
      }

      if (bookingStatus.isTimeBooked) {
        throw new BadRequestException(
          'This time slot is already booked by another customer.',
        );
      }
    }

    // If food delivery booking
    if (foodDeliveryItems.length > 0) {
      const firstFood = await this.prisma.foodDelivery.findUnique({
        where: { id: foodDeliveryItems[0].id },
      });
      if (!firstFood)
        throw new BadRequestException('Invalid food delivery ID provided.');
      userId = firstFood.userId;
      // No need to check provider availability for food delivery
    }

    if (!userId)
      throw new BadRequestException(
        'No valid service or food delivery selected.',
      );

    // Create payment (no amount, no quantity)
    const payment = await this.prisma.payment.create({
      data: {
        bookingLocation,
        firstName,
        lastName,
        email,
        phoneNumber,
        datetime: new Date(datetime),
        status,
        transactionRef,
        paymentMethod,
        userId,
      },
    });

    // Store service quantities
    for (const item of serviceItems) {
      const service = await this.prisma.service.findUnique({
        where: { id: item.id },
      });
      await this.prisma.paymentService.create({
        data: {
          paymentId: payment.id,
          serviceId: item.id,
          quantity: item.quantity || 1,
          initialPrice: service?.price ?? null,
        },
      });
    }

    for (const item of foodDeliveryItems) {
      const food = await this.prisma.foodDelivery.findUnique({
        where: { id: item.id },
      });
      await this.prisma.paymentFoodDelivery.create({
        data: {
          paymentId: payment.id,
          foodDeliveryId: item.id,
          quantity: item.quantity || 1,
          initialPrice: food?.price ?? null,
        },
      });
    }

    // Return payment with joined items
    return this.prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const { serviceIds, ...rest } = updatePaymentDto;
    // Update payment fields
    const payment = await this.prisma.payment.update({
      where: { id },
      data: rest,
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });

    // If serviceIds are provided, update PaymentService join table
    if (serviceIds && Array.isArray(serviceIds)) {
      // Remove existing relations
      await this.prisma.paymentService.deleteMany({ where: { paymentId: id } });
      // Add new relations
      for (const serviceId of serviceIds) {
        await this.prisma.paymentService.create({
          data: {
            paymentId: id,
            serviceId,
            quantity: 1, // or get from DTO if needed
            initialPrice: null, // or get from Service if needed
          },
        });
      }
    }

    // Return updated payment with joined items
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.payment.findMany({
      where: {
        userId,
      },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
      orderBy: { datetime: 'desc' },
    });
  }

  async findByProvider(providerId: number) {
    return this.prisma.payment.findMany({
      where: {
        services: {
          some: { userId: providerId },
        },
      },
      include: { services: true, user: true },
    });
  }

  async findFoodDeliveryBookingsByUser(userId: number) {
    // Only payments with food delivery items for the user
    return this.prisma.payment.findMany({
      where: {
        userId: userId,
        paymentFoodDeliveries: {
          some: {}, // at least one food delivery item
        },
      },
      include: {
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
      orderBy: { datetime: 'desc' },
    });
  }

  async handleAfripayCallback(body: any) {
    // Sanitize input data
    const sanitizedBody = this.afriPayValidation.sanitizeCallbackData(body);
    
    const { 
      status, 
      transaction_ref, 
      payment_method, 
      client_token,
      amount,
      currency,
      reference,
      message,
      gateway_response,
      signature
    } = sanitizedBody;

    // Validate required fields
    const fieldValidation = this.afriPayValidation.validateCallbackFields(sanitizedBody);
    if (!fieldValidation.isValid) {
      throw new BadRequestException(
        `Missing required fields: ${fieldValidation.missingFields.join(', ')}`
      );
    }

    // Validate signature if provided
    if (signature && !this.afriPayValidation.validateSignature(sanitizedBody, signature)) {
      throw new BadRequestException('Invalid callback signature');
    }

    // Validate payment exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id: Number(client_token) },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });

    if (!existingPayment) {
      throw new BadRequestException(`Payment with ID ${client_token} not found`);
    }

    // Map AfriPay status to our payment status
    let paymentStatus: string;
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
        paymentStatus = 'paid';
        break;
      case 'failed':
      case 'declined':
      case 'cancelled':
        paymentStatus = 'failed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        break;
      default:
        paymentStatus = status.toLowerCase();
    }

    // Update payment with callback data
    const updatedPayment = await this.prisma.payment.update({
      where: { id: Number(client_token) },
      data: {
        status: paymentStatus,
        transactionRef: transaction_ref || reference,
        paymentMethod: payment_method,
        // Store additional callback data if needed
        ...(amount && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(message && { message }),
        ...(gateway_response && { gatewayResponse: JSON.stringify(gateway_response) }),
      },
      include: {
        paymentServices: { include: { service: true } },
        paymentFoodDeliveries: { include: { foodDelivery: true } },
        user: true,
      },
    });

    console.log(`Payment ${client_token} updated to status: ${paymentStatus}`);
    
    // Log successful payment for monitoring
    if (paymentStatus === 'paid') {
      console.log(`Payment ${client_token} completed successfully for user ${existingPayment.user.email}`);
    }

    return updatedPayment;
  }
}
