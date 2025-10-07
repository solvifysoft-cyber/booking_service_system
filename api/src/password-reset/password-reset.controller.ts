import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { CreatePasswordResetDto } from './dto/create-password-reset.dto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  // Step 1: Request OTP (send email)
  @Post('request')
  async requestReset(@Body() dto: CreatePasswordResetDto) {
    if (!dto.email) throw new BadRequestException('Email is required');
    return this.passwordResetService.requestReset(dto.email);
  }

  // Step 2: Verify OTP and set new password
  @Post('verify')
  async verifyOtpAndReset(@Body() dto: CreatePasswordResetDto) {
    if (!dto.email || !dto.otp || !dto.newPassword) {
      throw new BadRequestException(
        'Email, OTP, and new password are required',
      );
    }
    return this.passwordResetService.verifyOtpAndReset(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
  }
}
