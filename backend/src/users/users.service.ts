import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Membership) private membershipRepo: Repository<Membership>,
  ) {}

  async create(dto: CreateUserDto) {
    const user = this.userRepo.create(dto as Partial<User>);
    const saved = await this.userRepo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  findAll() {
    return this.userRepo.find({ select: { password: false } as any });
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
      relations: ['memberships'],
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id: Number(id) },
      relations: ['memberships'],
      select: { password: false } as any,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.userRepo.remove(user);
    return { deleted: true };
  }

  async setActiveMembership(userId: string | number, membershipId: string | number) {
    await this.userRepo.update(Number(userId), {
      activeMembershipId: Number(membershipId),
    });
    return this.userRepo.findOne({ where: { id: Number(userId) } });
  }
}
