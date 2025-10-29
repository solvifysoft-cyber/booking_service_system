import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly db: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, confirmPassword, role, approved, phone, username, businessName, serviceCategory } = createUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check for existing email
    const existUserByEmail = await this.db.user.findUnique({
      where: { email },
    });

    if (existUserByEmail) {
      throw new ConflictException('User email already exists');
    }

    // Check for existing phone
    const existUserByPhone = await this.db.user.findUnique({
      where: { phone },
    });

    if (existUserByPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Check for existing username (if provided)
    if (username) {
      const existUserByUsername = await this.db.user.findUnique({
        where: { username },
      });

      if (existUserByUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // Check for existing business name (if provided)
    if (businessName) {
      const existUserByBusinessName = await this.db.user.findUnique({
        where: { businessName },
      });

      if (existUserByBusinessName) {
        throw new ConflictException('Business name already exists');
      }
    }

    // Enforce serviceCategory requirement except for admin
    if ((role !== 'admin' && role !== 'ADMIN') && !serviceCategory) {
      throw new BadRequestException('Service category is required for non-admin users');
    }

    const user = await this.db.user.create({
      data: {
        username: createUserDto.username,
        businessName: createUserDto.businessName,
        phone: createUserDto.phone,
        email: createUserDto.email,
        password: createUserDto.password, // TODO: Hash before save
        profileImage: createUserDto.profileImage ?? '',
        // Set role and approved, fallback to defaults if not provided
        role: role ?? 'user',
        approved: approved ?? false,
        serviceCategory: (role !== 'admin' && role !== 'ADMIN') ? serviceCategory : null,
      },
    });

    return this.mapUser(user);
  }

  async findAll() {
    const users = await this.db.user.findMany();
    return users.map(this.mapUser);
  }

  async findOne(id: number) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.db.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.db.user.update({
      where: { id },
      data: {
        username: updateUserDto.username,
        businessName: updateUserDto.businessName,
        phone: updateUserDto.phone,
        email: updateUserDto.email,
        password: updateUserDto.password,
        profileImage: updateUserDto.profileImage ?? user.profileImage,
        role: updateUserDto.role ?? user.role,
        approved:
          typeof updateUserDto.approved === 'boolean'
            ? updateUserDto.approved
            : user.approved,
        serviceCategory: updateUserDto.serviceCategory ?? user.serviceCategory,
      },
    });

    return this.mapUser(updated);
  }

  async remove(id: number) {
    const user = await this.db.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.db.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  // Approve user endpoint logic
  async approveUser(id: number) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const updated = await this.db.user.update({
      where: { id },
      data: { approved: true },
    });
    return { message: 'User approved', user: this.mapUser(updated) };
  }

  // Helper to map image field to full URL
  private mapUser(user: any) {
    return {
      ...user,
      profileImage: user.profileImage
        ? `http://localhost:3000/uploads/${user.profileImage}`
        : null,
    };
  }
}
