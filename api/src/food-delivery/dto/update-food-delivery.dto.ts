import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDeliveryDto } from './create-food-delivery.dto';

export class UpdateFoodDeliveryDto extends PartialType(CreateFoodDeliveryDto) {}
