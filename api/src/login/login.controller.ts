import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { LoginService } from './login.service';
import { CreateLoginDto } from './dto/create-login.dto';
import { UpdateLoginDto } from './dto/update-login.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  // Login: set session on success
  @Post()
  async login(@Req() req, @Body() createLoginDto: CreateLoginDto) {
    const result = await this.loginService.create(createLoginDto);
    // Store userId in session for authentication
    if (result && result.user && result.user.id) {
      req.session.userId = result.user.id;
      req.session.role = result.user.role;
    }
    return result;
  }

  // Logout: destroy session
  @Post('logout')
  async logout(@Req() req) {
    return new Promise((resolve) => {
      req.session.destroy(() => {
        resolve({ message: 'Logged out' });
      });
    });
  }

  // Check session and return user info
  @Get('me')
  async me(@Req() req) {
    if (req.session && req.session.userId) {
      try {
        // Fetch user details from database
        const user = await this.loginService.findUserById(req.session.userId);
        if (user) {
          return { 
            userId: req.session.userId, 
            role: req.session.role,
            email: user.email,
            username: user.username,
            businessName: user.businessName,
            approved: user.approved
          };
        }
      } catch (error) {
        // If user not found, clear session
        req.session.destroy();
      }
    }
    return { userId: null };
  }

  // Optional admin/management routes
  @Get()
  findAll() {
    return this.loginService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loginService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoginDto: UpdateLoginDto) {
    return this.loginService.update(+id, updateLoginDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loginService.remove(+id);
  }
}
