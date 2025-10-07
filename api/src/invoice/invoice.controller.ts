import { Controller, Post, Body } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('send')
  async sendInvoice(@Body() body: any) {
    const { to, phone, invoiceData } = body;
    await this.invoiceService.sendInvoice(to, phone, invoiceData);
    return { success: true };
  }
}
