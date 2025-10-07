import { Module } from '@nestjs/common';
import { FoodDeliveryService } from './food-delivery.service';
import { FoodDeliveryController } from './food-delivery.controller';

@Module({
  controllers: [FoodDeliveryController],
  providers: [FoodDeliveryService],
})
export class FoodDeliveryModule {}
