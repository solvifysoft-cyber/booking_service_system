import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
export enum LocationType {
  CUSTOM = 'CUSTOM',
  PROVIDER = 'PROVIDER',
  HYBRID = 'HYBRID',
}

export class CreateServiseDto {
  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  images?: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(LocationType)
  locationType!: LocationType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(1)
  duration!: number; // Duration in minutes for the service

  @IsString()
  @IsNotEmpty()
  userEmail!: string;
}
