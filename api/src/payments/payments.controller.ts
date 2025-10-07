import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AfriPayCallbackDto } from './dto/afripay-callback.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.paymentsService.findByUser(Number(userId));
  }

  @Get('provider/:providerId')
  findByProvider(@Param('providerId') providerId: string) {
    return this.paymentsService.findByProvider(+providerId);
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.findOne(+paymentId);
  }

  @Get('food-delivery/user/:userId')
  async getFoodDeliveryBookingsByUser(@Param('userId') userId: string) {
    return this.paymentsService.findFoodDeliveryBookingsByUser(Number(userId));
  }

  @Post('afripay-callback')
  @UseInterceptors(AnyFilesInterceptor())
  @HttpCode(200)
  async afripayCallback(@Body() body: any) {
    try {
      console.log('AfriPay Callback received:', JSON.stringify(body, null, 2));
      const result = await this.paymentsService.handleAfripayCallback(body);
      return { 
        status: 'success', 
        message: 'Callback processed successfully',
        paymentId: result.id,
        paymentStatus: result.status
      };
    } catch (error) {
      console.error('AfriPay Callback Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Callback processing failed';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      return { 
        status: 'error', 
        message: errorMessage,
        error: errorName
      };
    }
  }

  @Post('test-afripay-callback')
  @UseInterceptors(AnyFilesInterceptor())
  @HttpCode(200)
  async testAfripayCallback(@Body() body: any) {
    try {
      const status = body?.status || body?.payment_status || 'success';
      const token = (body?.client_token ?? body?.paymentId);

      if (!token) {
        throw new Error('Missing client_token or paymentId');
      }

      const testCallback: AfriPayCallbackDto = {
        status,
        client_token: String(token),
        transaction_ref: `TEST_${Date.now()}`,
        payment_method: body?.payment_method || 'test',
        amount: body?.amount || '100.00',
        currency: body?.currency || 'USD',
        message: body?.message || 'Test payment callback'
      };
      
      console.log('Test AfriPay Callback:', JSON.stringify(testCallback, null, 2));
      const result = await this.paymentsService.handleAfripayCallback(testCallback);
      return { 
        status: 'success', 
        message: 'Test callback processed successfully',
        paymentId: result.id,
        paymentStatus: result.status
      };
    } catch (error) {
      console.error('Test AfriPay Callback Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Test callback processing failed';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      return { 
        status: 'error', 
        message: errorMessage,
        error: errorName
      };
    }
  }
}
