import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // PATCH /user/:id/approve - Approve a user (admin only)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Headers('userrole') userRole: string) {
    if (userRole !== 'admin') throw new UnauthorizedException('Admins only');
    return this.userService.approveUser(Number(id));
  }

  // PATCH /user/:id/reject - Reject a user (admin only)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Headers('userrole') userRole: string) {
    if (userRole !== 'admin') throw new UnauthorizedException('Admins only');
    return this.userService.update(Number(id), { approved: false });
  }
}
