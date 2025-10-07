import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePasswordResetDto } from './dto/create-password-reset.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  // Step 1: Request OTP and send email
  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No user with this email');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.passwordReset.create({
      data: { email, otp, expiresAt },
    });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP is: ${otp}`,
    });

    return { message: 'OTP sent to email' };
  }

  // Step 2: Verify OTP and reset password
  async verifyOtpAndReset(email: string, otp: string, newPassword: string) {
    const record = await this.prisma.passwordReset.findFirst({
      where: { email, otp },
      orderBy: { expiresAt: 'desc' },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user password (hash in production!)
    await this.prisma.user.update({
      where: { email },
      data: { password: newPassword },
    });

    // Delete all OTPs for this email
    await this.prisma.passwordReset.deleteMany({ where: { email } });

    return { message: 'Password reset successful' };
  }
}
