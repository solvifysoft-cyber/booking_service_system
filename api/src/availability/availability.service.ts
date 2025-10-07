import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new availability record
  async create(createAvailabilityDto: CreateAvailabilityDto) {
    const availability = await this.prisma.availability.create({
      data: {
        userId: createAvailabilityDto.userId,
        dayFrom: createAvailabilityDto.dayFrom,
        dayTo: createAvailabilityDto.dayTo,
        hourFrom: createAvailabilityDto.hourFrom,
        hourTo: createAvailabilityDto.hourTo,
        unavailable: createAvailabilityDto.unavailable ?? false,
        reason: createAvailabilityDto.reason,
        emergency: createAvailabilityDto.emergency ?? false,
        duration: createAvailabilityDto.duration,
      },
    });
    return this.mapAvailability(availability);
  }

  // Get all availability records
  async findAll() {
    const availabilities = await this.prisma.availability.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return availabilities.map(this.mapAvailability);
  }

  // Get a single availability record by ID
  async findOne(id: number) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    return this.mapAvailability(availability);
  }

  // ✅ Get all availabilities for a specific user
  async findByUser(userId: number) {
    const availabilities = await this.prisma.availability.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // If only one "normal" availability is needed:
    const normal = availabilities.find((a) => !a.unavailable && !a.emergency);

    return normal
      ? [this.mapAvailability(normal)]
      : availabilities.map(this.mapAvailability);
  }

  // Update an availability record by ID
  async update(id: number, updateAvailabilityDto: UpdateAvailabilityDto) {
    const existing = await this.prisma.availability.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    const updated = await this.prisma.availability.update({
      where: { id },
      data: {
        ...updateAvailabilityDto,
      },
    });
    return this.mapAvailability(updated);
  }

  // Delete an availability record by ID
  async remove(id: number) {
    const existing = await this.prisma.availability.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    await this.prisma.availability.delete({ where: { id } });
    return { message: 'Availability deleted successfully' };
  }

  // Helper function to clean availability format
  private mapAvailability(availability: any) {
    return {
      id: availability.id,
      userId: availability.userId,
      dayFrom: availability.dayFrom,
      dayTo: availability.dayTo,
      hourFrom: availability.hourFrom,
      hourTo: availability.hourTo,
      unavailable: availability.unavailable,
      reason: availability.reason,
      emergency: availability.emergency,
      duration: availability.duration,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
    };
  }
}
