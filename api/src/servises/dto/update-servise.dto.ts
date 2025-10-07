import { PartialType } from '@nestjs/mapped-types';
import { CreateServiseDto } from './create-servise.dto';

export class UpdateServiseDto extends PartialType(CreateServiseDto) {}
