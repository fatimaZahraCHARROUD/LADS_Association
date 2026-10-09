import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
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

  // POST /meetings
  async create(dto: CreateMeetingDto, userId: string) {
    // Un Team Manager ne peut créer qu'une réunion de SES départements
    if ((await this.getActiveRole(userId)) === 'Team Manager') {
      const deptIds = await this.getTeamManagerDepartmentIds(userId);
      if (!dto.departmentId || !deptIds.includes(dto.departmentId)) {
        throw new ForbiddenException(
          'You can only manage meetings of your own departments',
        );
      }
    }

    return this.meetingModel.create({
      ...dto,
      departmentId: dto.departmentId ?? null,
      createdBy: userId,
    });
  }

  // GET /meetings
  async findAll(from?: string, to?: string, userId?: string) {
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.startAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }

    // Un Team Manager ne voit que les réunions de ses départements
    if (userId && (await this.getActiveRole(userId)) === 'Team Manager') {
      const deptIds = await this.getTeamManagerDepartmentIds(userId);
      if (deptIds.length === 0) {
        filter._id = { $in: [] }; // aucun département assigné
      } else {
        filter.departmentId = { $in: deptIds };
      }
    }

    return this.meetingModel
      .find(filter)
      .sort({ startAt: 1 })
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('departmentId', 'name')
      .exec();
  }

  // GET /meetings/:id
  async findOne(id: string, userId?: string) {
    const meeting = await this.meetingModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('departmentId', 'name')
      .exec();
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);

    if (userId) await this.assertCanManage(meeting, userId);
    return meeting;
  }

  // PATCH /meetings/:id
  async update(id: string, dto: UpdateMeetingDto, userId?: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    if (userId) await this.assertCanManage(existing, userId);

    const safe: Record<string, unknown> = { ...dto };
    delete safe.createdBy;
    return this.meetingModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  // DELETE /meetings/:id
  async remove(id: string, userId?: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    if (userId) await this.assertCanManage(existing, userId);

    await this.meetingModel.findByIdAndDelete(id).exec();
    return { message: 'Meeting deleted' };
  }

  // ─────────────────────────────────────────────
  //  Helpers (étape 2)
  // ─────────────────────────────────────────────

  // Vérifie que, si l'utilisateur est un Team Manager, la réunion appartient
  // à un de SES départements (sinon -> Forbidden).
  private async assertCanManage(meeting: MeetingDocument, userId: string) {
    if ((await this.getActiveRole(userId)) !== 'Team Manager') return;
    const deptIds = await this.getTeamManagerDepartmentIds(userId);
    if (!meeting.departmentId || !deptIds.includes(String(meeting.departmentId))) {
      throw new ForbiddenException(
        'You can only manage meetings of your own departments',
      );
    }
  }

  // Rôle actif de l'utilisateur (même logique que ActiveRoleGuard)
  private async getActiveRole(userId: string): Promise<string | null> {
    const user = await this.userModel
      .findById(userId)
      .select('memberships activeMembershipId isAdmin role')
      .lean()
      .exec();
    if (!user) return null;
    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return 'President';
    }
    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    return active?.role ?? null;
  }

  // Les ID des départements que gère un Team Manager
  private async getTeamManagerDepartmentIds(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('memberships').lean().exec();
    const deptIds = new Set<string>();
    (user?.memberships ?? []).forEach((m: any) => {
      if (m.role === 'Team Manager' && m.departmentId) {
        deptIds.add(String(m.departmentId));
      }
    });
    const depts = await this.departmentModel
      .find({
        teamManagers: Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : userId,
      })
      .select('_id')
      .lean()
      .exec();
    depts.forEach((d) => deptIds.add(String(d._id)));
    return [...deptIds];
  }
}