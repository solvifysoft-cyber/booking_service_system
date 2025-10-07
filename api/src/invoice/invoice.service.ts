import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Twilio } from 'twilio';

@Injectable()
export class InvoiceService {
  async sendInvoice(to: string, phone: string, invoiceData: any) {
    // 1. Generate PDF
    const pdfBuffer = await this.generateInvoicePdf(invoiceData);

    // 2. Send Email with PDF
    await this.sendEmailWithAttachment(to, pdfBuffer);

    // 3. Send WhatsApp with PDF (optional)
    if (phone) {
      await this.sendWhatsAppWithAttachment(phone, pdfBuffer);
    }
  }

  async generateInvoicePdf(invoiceData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // --- PDF Content ---
      doc
        .image(path.join(__dirname, '../../assets/LOGO-SERVICE.png'), 40, 20, {
          width: 120,
        })
        .moveDown();
      doc.fontSize(18).text('SERVICE INVOICE', { align: 'center' }).moveDown();

      // Service provider section
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Service provider:', { underline: true });
      doc.font('Helvetica');
      doc.text(
        `Name: ${invoiceData.provider?.businessName || invoiceData.provider?.username || ''}`,
      );
      doc.text(`Email: ${invoiceData.provider?.email || ''}`);
      doc.text(`Phone: ${invoiceData.provider?.phone || ''}`).moveDown();

      doc.text(`Client:`, { underline: true });
      doc.text(`Name: ${invoiceData.client?.name || ''}`);
      doc.text(`Email: ${invoiceData.client?.email || ''}`);
      doc.text(`Phone: ${invoiceData.client?.phone || ''}`).moveDown();

      doc.text('Service details', { underline: true }).moveDown(0.5);

      // Table header
      doc
        .font('Helvetica-Bold')
        .text('Service', 60, doc.y, { continued: true });
      doc.text('Amount', 350, doc.y);
      doc.font('Helvetica');

      // Table rows
      invoiceData.services.forEach((s) => {
        doc.text(s.name, 60, doc.y, { continued: true });
        doc.text(`${Number(s.price).toLocaleString()} Rwf`, 350, doc.y);
      });

      doc.moveDown();
      doc
        .font('Helvetica-Bold')
        .text(
          `Total amount paid: ${Number(invoiceData.total).toLocaleString()} Rwf`,
        );
      doc.font('Helvetica').moveDown();

      doc.text(
        `Payment Made at: ${invoiceData.paymentDate} ${invoiceData.paymentTime}`,
      );

      // Add a line break for readability
      doc.moveDown();

      doc.text(
        `Service Due: ${invoiceData.serviceDate} ${invoiceData.serviceTime}`,
      );
      const locationType = invoiceData.locationType;
      let locationLabel = 'Service location';
      if (locationType === 'PROVIDER') {
        locationLabel = 'Service location - AT Provider Location';
      } else if (locationType === 'CUSTOM') {
        locationLabel = 'Service location - AT Custom Location';
      }
      doc.text(`${locationLabel}: ${invoiceData.location}`);

      doc.moveDown();
      doc.text(`Need help? ${invoiceData.provider?.phone || ''}`);

      doc.end();
    });
  }

  async sendEmailWithAttachment(to: string, pdfBuffer: Buffer) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER, // set in .env
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Your Service Invoice',
      text: 'Please find your service invoice attached.',
      attachments: [
        {
          filename: 'invoice.pdf',
          content: pdfBuffer,
        },
      ],
    });
  }

  async sendWhatsAppWithAttachment(phone: string, pdfBuffer: Buffer) {
    // Twilio WhatsApp API
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'
    const client = new Twilio(accountSid, authToken);

    // Save PDF to temp file
    const tempPath = path.join(
      __dirname,
      `../../uploads/invoice-${Date.now()}.pdf`,
    );
    fs.writeFileSync(tempPath, pdfBuffer);

    // You must upload the PDF to a public URL for Twilio to send it as media!
    // For demo, you can serve /uploads as static in NestJS and use http://your-server/uploads/invoice-xxxx.pdf
    const publicUrl = `https://8ea5-197-157-187-121.ngrok-free.app/uploads/${path.basename(tempPath)}`;

    await client.messages.create({
      from: fromWhatsApp,
      to: `whatsapp:+${phone.replace(/^(\+)?/, '')}`,
      body: 'Your service invoice is attached.',
      mediaUrl: [publicUrl],
    });

    // Optionally, delete the temp file after some time
    setTimeout(() => fs.unlinkSync(tempPath), 60000);
  }
}
