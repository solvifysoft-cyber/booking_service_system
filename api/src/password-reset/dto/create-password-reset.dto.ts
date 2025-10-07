import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePasswordResetDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  otp?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
