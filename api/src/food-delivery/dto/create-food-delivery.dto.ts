import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateFoodDeliveryDto {
  @IsString()
  category!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  foodDescription?: string;

  @IsOptional()
  @IsString()
  foodImage?: string;

  @IsInt()
  userId!: number;
}
