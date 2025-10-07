import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
