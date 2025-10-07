import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiseDto } from './dto/create-servise.dto';
import { UpdateServiseDto } from './dto/update-servise.dto';

@Injectable()
export class ServisesService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE a new service
  async create(createServiceDto: CreateServiseDto) {
    const service = await this.prisma.service.create({
      data: {
        category: createServiceDto.category,
        name: createServiceDto.name,
        images: createServiceDto.images ?? '',
        price: createServiceDto.price,
        location: createServiceDto.location,
        locationType: createServiceDto.locationType,
        description: createServiceDto.description,
        duration: createServiceDto.duration, // <-- handle duration
        user: {
          connect: { email: createServiceDto.userEmail },
        },
      },
    });
    // Map images field to full URL
    return {
      ...service,
      images: service.images
        ? `http://localhost:3000/uploads/${service.images}`
        : null,
    };
  }

  // READ all services
  async findAll() {
    const services = await this.prisma.service.findMany({
      include: {
        user: true,
      },
      where: {
        user: {
          approved: true,
        },
      },
    });
    // Map images field to full URL
    return services.map((service) => ({
      ...service,
      images: service.images
        ? `http://localhost:3000/uploads/${service.images}`
        : null,
    }));
  }

  // READ one service by ID
  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Map images field to full URL
    return {
      ...service,
      images: service.images
        ? `http://localhost:3000/uploads/${service.images}`
        : null,
    };
  }

  // UPDATE a service by ID
  async update(id: number, updateServiceDto: UpdateServiseDto) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        category: updateServiceDto.category,
        name: updateServiceDto.name,
        images: updateServiceDto.images,
        price: updateServiceDto.price,
        location: updateServiceDto.location,
        locationType: updateServiceDto.locationType,
        description: updateServiceDto.description,
        duration: updateServiceDto.duration, // <-- handle duration
        // Note: userId is not updated here; adjust if needed.
      },
    });

    // Map images field to full URL
    return {
      ...service,
      images: service.images
        ? `http://localhost:3000/uploads/${service.images}`
        : null,
    };
  }

  // DELETE a service by ID
  async remove(id: number) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return await this.prisma.service.delete({
      where: { id },
    });
  }
}
