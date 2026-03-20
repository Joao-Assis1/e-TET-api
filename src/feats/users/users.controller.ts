import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user.entity';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { senha, ...result } = user;
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
