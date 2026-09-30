import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { getUserId } from '../services/jwt/current-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
@UseGuards(JwtAuthGuard)
  @Post('switch-role')
switchRole(@Body() body: { membershipId: string }, @Req() req: any) {
  return this.authService.switchRole(getUserId(req), body.membershipId);
}

   @Post('register')
  register(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);
  }
}
