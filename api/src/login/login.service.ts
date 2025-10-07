import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateLoginDto } from './dto/create-login.dto';
import { UpdateLoginDto } from './dto/update-login.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LoginService {
  constructor(private prisma: PrismaService) {}

  async create(createLoginDto: CreateLoginDto) {
    const { email, password } = createLoginDto;

    // Check if user exists by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Check password (plain text comparison; hash in production)
    const passwordMatch = password === user.password;
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    // Admins can always log in, users must be approved
    if (user.role !== 'admin' && !user.approved) {
      throw new UnauthorizedException(
        'Your account is pending admin approval.',
      );
    }

    // Return success response (include role and approved)
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approved,
        username: user.username,
        businessName: user.businessName,
        joinedAt: user.createdAt,
      },
    };
  }

  findAll() {
    return `This action returns all login attempts`;
  }

  findOne(id: number) {
    return `This action returns login attempt #${id}`;
  }

  update(id: number, updateLoginDto: UpdateLoginDto) {
    return `This action updates login #${id} with data: ${JSON.stringify(updateLoginDto)}`;
  }

  remove(id: number) {
    return `This action removes login #${id}`;
  }

  // Find user by ID for session validation
  async findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        businessName: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    });
  }
}
