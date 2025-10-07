import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ArrayUnique,
} from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  bookingLocation?: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  datetime!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  serviceIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  foodDeliveryIds?: number[];

  @IsOptional()
  @IsArray()
  serviceItems?: { id: number; quantity: number }[];

  @IsOptional()
  @IsArray()
  foodDeliveryItems?: { id: number; quantity: number }[];
}
