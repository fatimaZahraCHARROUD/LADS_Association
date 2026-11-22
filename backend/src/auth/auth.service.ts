import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Membership } from '../users/schemas/user.schema';
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

    const memberships = user.memberships ?? [];
    let activeMembership = memberships.find(
      (membership) =>
        String(membership._id) === String(user.activeMembershipId ?? ''),
    );

    if (!activeMembership && memberships.length) {
      activeMembership = memberships[0];
      await this.usersService.setActiveMembership(
        String(user._id),
        String(activeMembership._id),
      );
    }
    const activeId = activeMembership?._id ?? null;

    const token = this.jwtService.sign({
      userId: user._id,
      sub: user._id,
      email: user.email,
      name: user.fullName,
      role: user.role,
    });

    return {
      message: 'Login successful',
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        memberships,
        activeMembershipId: activeId,
        isAdmin: user.isAdmin,
      },
    };
  }

  async switchRole(userId: string, membershipId: string) {
    const user = await this.usersService.findOne(userId);

    const membership = user.memberships?.find(
      (m: Membership) => String(m._id) === String(membershipId),
    );

    if (!membership) {
      throw new BadRequestException('Membership not found');
    }

    const updatedUser = await this.usersService.setActiveMembership(
      userId,
      membership._id,
    );
    if (
      !updatedUser?.activeMembershipId ||
      String(updatedUser.activeMembershipId) !== String(membership._id)
    ) {
      throw new InternalServerErrorException(
        'The selected membership could not be persisted',
      );
    }

    return {
      message: 'Role switched',
      activeMembership: membership,
      activeMembershipId: String(updatedUser.activeMembershipId),
      memberships: updatedUser.memberships ?? [],
    };
  }

  async register(dto: CreateAuthDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
    });

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
