import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ServisesService } from './servises.service';
import { CreateServiseDto } from './dto/create-servise.dto';
import { UpdateServiseDto } from './dto/update-servise.dto';

@Controller('servises')
export class ServisesController {
  constructor(private readonly servisesService: ServisesService) {}

  @Post()
  create(@Body() createServiseDto: CreateServiseDto) {
    return this.servisesService.create(createServiseDto);
  }

  @Get()
  findAll() {
    return this.servisesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servisesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiseDto: UpdateServiseDto) {
    return this.servisesService.update(+id, updateServiseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servisesService.remove(+id);
  }
}
