import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FoodDeliveryService } from './food-delivery.service';
import { CreateFoodDeliveryDto } from './dto/create-food-delivery.dto';
import { UpdateFoodDeliveryDto } from './dto/update-food-delivery.dto';

@Controller('food-delivery')
export class FoodDeliveryController {
  constructor(private readonly foodDeliveryService: FoodDeliveryService) {}

  @Post()
  create(@Body() createFoodDeliveryDto: CreateFoodDeliveryDto) {
    return this.foodDeliveryService.create(createFoodDeliveryDto);
  }

  @Get()
  findAll() {
    return this.foodDeliveryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodDeliveryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFoodDeliveryDto: UpdateFoodDeliveryDto,
  ) {
    return this.foodDeliveryService.update(+id, updateFoodDeliveryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foodDeliveryService.remove(+id);
  }
}
