import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadService } from '../upload/upload.service';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    private uploadService: UploadService,
  ) {}

  async create(userId: string, dto: CreateActivityDto) {
    const departmentId = dto.departmentId ? Number(dto.departmentId) : null;
    const memberId = dto.memberId ? Number(dto.memberId) : null;

    if (departmentId) {
      const department = await this.departmentRepo.findOne({ where: { id: departmentId } });
      if (!department) throw new BadRequestException('Department not found');

      if (memberId) {
        const memberExists = await this.userRepo.findOne({ where: { id: memberId } });
        if (!memberExists) throw new BadRequestException('Member not found');

        const allMembers = [
          department.manager,
          department.viceManager,
          ...(department.teamManagers ?? []),
          ...(department.members ?? []),
        ].filter(Boolean);

        if (!allMembers.includes(memberId)) {
          throw new BadRequestException('The member does not belong to the selected department');
        }
      }
    }

    const activity = this.activityRepo.create({
      ...dto,
      createdBy: Number(userId),
      departmentId,
      memberId,
    } as Partial<Activity>);

    return this.activityRepo.save(activity);
  }

  findAll(status?: string, isPublished?: boolean) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    return this.activityRepo.find({ where, order: { activityDate: 'DESC' } });
  }

  async findOne(id: string) {
    const activity = await this.activityRepo.findOne({ where: { id: Number(id) } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    const existing = await this.activityRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Activity ${id} not found`);

    if (dto.image && existing.image && dto.image !== existing.image) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(existing.coverImagePublicId);
      }
    }

    Object.assign(existing, dto);
    return this.activityRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.activityRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Activity ${id} not found`);

    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(existing.coverImagePublicId);
    }

    await this.activityRepo.remove(existing);
    return { message: 'Activity deleted' };
  }

  async togglePublish(id: string) {
    const activity = await this.activityRepo.findOne({ where: { id: Number(id) } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    activity.isPublished = !activity.isPublished;
    return this.activityRepo.save(activity);
  }
}
