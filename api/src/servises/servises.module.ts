import { Module } from '@nestjs/common';
import { ServisesService } from './servises.service';
import { ServisesController } from './servises.controller';

@Module({
  controllers: [ServisesController],
  providers: [ServisesService],
})
export class ServisesModule {}
