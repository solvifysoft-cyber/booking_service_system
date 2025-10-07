import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodDeliveryDto } from './dto/create-food-delivery.dto';
import { UpdateFoodDeliveryDto } from './dto/update-food-delivery.dto';

@Injectable()
export class FoodDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFoodDeliveryDto: CreateFoodDeliveryDto) {
    return this.prisma.foodDelivery.create({
      data: {
        category: createFoodDeliveryDto.category,
        name: createFoodDeliveryDto.name,
        price: createFoodDeliveryDto.price,
        ingredients: createFoodDeliveryDto.ingredients,
        foodDescription: createFoodDeliveryDto.foodDescription,
        foodImage: createFoodDeliveryDto.foodImage,
        userId: createFoodDeliveryDto.userId,
      },
    });
  }

  async findAll() {
    return this.prisma.foodDelivery.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const food = await this.prisma.foodDelivery.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!food) throw new NotFoundException(`FoodDelivery #${id} not found`);
    return food;
  }

  async update(id: number, updateFoodDeliveryDto: UpdateFoodDeliveryDto) {
    const food = await this.prisma.foodDelivery.findUnique({ where: { id } });
    if (!food) throw new NotFoundException(`FoodDelivery #${id} not found`);
    return this.prisma.foodDelivery.update({
      where: { id },
      data: updateFoodDeliveryDto,
    });
  }

  async remove(id: number) {
    const food = await this.prisma.foodDelivery.findUnique({ where: { id } });
    if (!food) throw new NotFoundException(`FoodDelivery #${id} not found`);
    await this.prisma.foodDelivery.delete({ where: { id } });
    return { message: 'FoodDelivery deleted successfully' };
  }
}
