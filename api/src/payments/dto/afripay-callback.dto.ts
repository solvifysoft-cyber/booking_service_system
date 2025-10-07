import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

export class AfriPayCallbackDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  transaction_ref?: string;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsNotEmpty()
  client_token!: string;

  @IsString()
  @IsOptional()
  amount?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsObject()
  @IsOptional()
  gateway_response?: Record<string, any>;

  @IsString()
  @IsOptional()
  signature?: string;
}
