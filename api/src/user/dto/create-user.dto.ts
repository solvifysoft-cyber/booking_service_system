import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsStrongPassword,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsNotEmpty()
  @IsPhoneNumber('RW') // Use 'RW' for Rwanda or 'ZZ' for any region
  phone!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean; // Admin approval status

  @IsOptional()
  @IsString()
  role?: string; // 'admin' or 'user'
}
