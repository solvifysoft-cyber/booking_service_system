import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsInt()
  userId!: number;

  @IsString()
  dayFrom!: string; // e.g. "Monday"

  @IsString()
  dayTo!: string; // e.g. "Saturday"

  @IsString()
  hourFrom!: string; // e.g. "14:06"

  @IsString()
  hourTo!: string; // e.g. "18:00"

  @IsBoolean()
  @IsOptional()
  unavailable?: boolean = false; // true if provider is unavailable

  @IsString()
  @IsOptional()
  reason?: string; // Reason for unavailability or emergency

  @IsBoolean()
  @IsOptional()
  emergency?: boolean = false; // true if this is an emergency lock

  @IsNumber()
  @IsOptional()
  duration?: number; // Duration in minutes for emergency/unavailability
}
