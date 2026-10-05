import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name)
    private meetingModel: Model<MeetingDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private async getMyDepartmentIds(userId: string): Promise<string[]> {
    const departments = await this.departmentModel
      .find({
        $or: [
          { manager: userId },
          { viceManager: userId },
          { teamManagers: userId },
          { members: userId },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    return departments.map((d) => String(d._id));
  }

  async create(dto: CreateMeetingDto, userId: string) {
    const myDepartmentIds = await this.getMyDepartmentIds(userId);
    const department = myDepartmentIds[0];
    if (!department) {
      throw new BadRequestException(
        'Your account is not assigned to any department',
      );
    }
    return this.meetingModel.create({ ...dto, department, createdBy: userId });
  }

  private async maskLinks(meetings: any[], userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('role')
      .lean()
      .exec();
    const isPresident = !!user?.role?.includes('President');
    if (isPresident) return meetings;

    const myDepartmentIds = new Set(await this.getMyDepartmentIds(userId));

    return meetings.map((m) => {
      const obj = m.toObject ? m.toObject() : m;
      const deptId = obj.department?._id
        ? String(obj.department._id)
        : obj.department
          ? String(obj.department)
          : null;
      const inMyDept = deptId && myDepartmentIds.has(deptId);
      if (!inMyDept) obj.meetingLink = '';
      return obj;
    });
  }

  async findAll(userId: string, from?: string, to?: string) {
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.startAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }
    const meetings = await this.meetingModel
      .find(filter)
      .sort({ startAt: 1 })
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('department', 'name')
      .exec();
    return this.maskLinks(meetings, userId);
  }

  async findOne(id: string, userId: string) {
    const meeting = await this.meetingModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('department', 'name')
      .exec();
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);
    const [masked] = await this.maskLinks([meeting], userId);
    return masked;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    const safe: Record<string, unknown> = { ...dto };
    delete safe.createdBy;
    delete (safe as any).department;
    return this.meetingModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  async remove(id: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    await this.meetingModel.findByIdAndDelete(id).exec();
    return { message: 'Meeting deleted' };
  }
}
