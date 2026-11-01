import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadService } from '../upload/upload.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<ActivityDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,

    private uploadService: UploadService,
  ) {}
  async create(userId: string, dto: CreateActivityDto) {
    if (
      (dto.departmentId && !Types.ObjectId.isValid(dto.departmentId)) ||
      (dto.memberId && !Types.ObjectId.isValid(dto.memberId))
    ) {
      throw new BadRequestException('Invalid department or member ID');
    }

    const departmentId = dto.departmentId
      ? new Types.ObjectId(dto.departmentId)
      : null;
    const memberId = dto.memberId ? new Types.ObjectId(dto.memberId) : null;

    let department: {
      manager?: Types.ObjectId | null;
      viceManager?: Types.ObjectId | null;
      teamManagers?: Types.ObjectId[];
      members?: Types.ObjectId[];
    } | null = null;
    if (departmentId) {
      department = await this.departmentModel
        .findById(departmentId)
        .select('manager viceManager teamManagers members')
        .lean()
        .exec();
      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    if (memberId) {
      const memberExists = await this.userModel.exists({ _id: memberId });
      if (!memberExists) {
        throw new BadRequestException('Member not found');
      }
      if (departmentId) {
        const belongsToDepartment = [
          department?.manager,
          department?.viceManager,
          ...(department?.teamManagers ?? []),
          ...(department?.members ?? []),
        ].some(
          (assignedMemberId) => String(assignedMemberId) === String(memberId),
        );
        if (!belongsToDepartment) {
          throw new BadRequestException(
            'The member does not belong to the selected department',
          );
        }
      }
    }

    return this.activityModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
      departmentId,
      memberId,
    });
  }

  findAll(status?: string, isPublished?: boolean) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (isPublished !== undefined) filter.isPublished = isPublished;
    return this.activityModel.find(filter).sort({ activityDate: -1 }).exec();
  }

  async findOne(id: string) {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    const existing = await this.activityModel.findById(id).exec();

    if (!existing) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    // ✅ delete old image if replaced
    if (dto.image && existing.image && dto.image !== existing.image) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(existing.coverImagePublicId);
      }
    }

    const updated = await this.activityModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    return updated;
  }

  async remove(id: string) {
    const existing = await this.activityModel.findById(id).exec();

    if (!existing) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    // ✅ delete cloudinary image
    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(existing.coverImagePublicId);
    }

    await this.activityModel.findByIdAndDelete(id).exec();

    return {
      message: 'Activity deleted',
    };
  }

  async togglePublish(id: string) {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    activity.isPublished = !activity.isPublished;
    return activity.save();
  }
}
