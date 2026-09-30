import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto) {
    const user = await this.userModel.create(dto);
    const { password: _, ...result } = user.toObject();
    return result;
  }

  findAll() {
    return this.userModel.find().select('-password').exec();
  }

 async findByEmail(email: string) {
  return this.userModel
    .findOne({ email })
    .populate('memberships.departmentId', 'name')
    .exec();
}

 async findOne(id: string) {
  const user = await this.userModel
    .findById(id)
    .select('-password')
    .populate('memberships.departmentId', 'name')
    .exec();
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
}

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { deleted: true };
  }

 async setActiveMembership(
  userId: string | Types.ObjectId,
  membershipId: string | Types.ObjectId,
) {
  return this.userModel
    .findByIdAndUpdate(
      userId,
      { activeMembershipId: membershipId },
      { new: true },
    )
    .exec();
}
}
