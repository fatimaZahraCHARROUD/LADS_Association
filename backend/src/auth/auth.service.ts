import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashService } from '../services/hash.service';
import { JwtCustomService } from '../services/jwt/jwt.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashService: HashService,
    private jwtService: JwtCustomService,
  ) {}
  

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await this.hashService.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      userId: user._id,
      email: user.email,
    });

    return {
      message: 'Login successful',
      access_token: token,
      user,
    };
  }

  async register(dto: CreateAuthDto) {
    // 1. check if user exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // 2. hash password
    const hashedPassword = await this.hashService.hash(dto.password);

    // 3. create user
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
    });

    // 4. generate JWT
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
    });

    // 5. return response
    return {
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
      },
      access_token: token,
    };
  }

  
}