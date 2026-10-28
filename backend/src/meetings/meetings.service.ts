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
import { resolveAccess, EffectiveAccess } from '../services/jwt/effective-role';

interface Ctx {
  access: EffectiveAccess;
  /** departments the user belongs to (links visible) */
  memberDeptIds: Set<string>;
  /** departments the user can manage (write access) */
  managedDeptIds: Set<string>;
}

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
    const ctx = await this.getContext(userId);
    let departmentId: any = dto.departmentId ?? null;

    if (!this.isGlobal(ctx)) {
      if (!departmentId) {
        const active = ctx.access.activeDepartmentId;
        if (active && ctx.managedDeptIds.has(active)) departmentId = active;
        else if (ctx.managedDeptIds.size === 1)
          departmentId = [...ctx.managedDeptIds][0];
      }
      if (!departmentId || !ctx.managedDeptIds.has(String(departmentId))) {
        throw new ForbiddenException(
          'You can only manage meetings of your own departments',
        );
      }
    }

    return this.meetingModel.create({
      ...dto,
      departmentId,
      createdBy: userId,
    });
  }

  // GET /meetings  (everyone sees all meetings, links are masked)
  async findAll(from?: string, to?: string, userId?: string) {
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.startAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }

    const meetings: any[] = await this.meetingModel
      .find(filter)
      .sort({ startAt: 1 })
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('departmentId', 'name')
      .lean()
      .exec();

    const ctx = userId ? await this.getContext(userId) : null;
    return meetings.map((m) => this.maskLink(m, ctx));
  }

  // GET /meetings/:id
  async findOne(id: string, userId?: string) {
    const meeting: any = await this.meetingModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .populate('departmentId', 'name')
      .lean()
      .exec();
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);

    const ctx = userId ? await this.getContext(userId) : null;
    return this.maskLink(meeting, ctx);
  }

  // PATCH /meetings/:id
  async update(id: string, dto: UpdateMeetingDto, userId: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);

    const ctx = await this.getContext(userId);
    this.assertCanManage(existing, ctx);

    const safe: Record<string, any> = { ...dto };
    delete safe.createdBy;
    delete safe.department;

    // a non-global writer cannot move a meeting to a department they don't manage
    if (
      safe.departmentId &&
      !this.isGlobal(ctx) &&
      !ctx.managedDeptIds.has(String(safe.departmentId))
    ) {
      throw new ForbiddenException(
        'You can only manage meetings of your own departments',
      );
    }

    return this.meetingModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  // DELETE /meetings/:id
  async remove(id: string, userId: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);

    const ctx = await this.getContext(userId);
    this.assertCanManage(existing, ctx);

    await this.meetingModel.findByIdAndDelete(id).exec();
    return { message: 'Meeting deleted' };
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  // GET /meetings/meta/my-departments: departments the user can write to
  async listWritableDepartments(userId: string) {
    const ctx = await this.getContext(userId);
    const filter = this.isGlobal(ctx)
      ? {}
      : {
          _id: {
            $in: [...ctx.managedDeptIds].map((i) => new Types.ObjectId(i)),
          },
        };
    return this.departmentModel
      .find(filter)
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  private isGlobal(ctx: Ctx): boolean {
    return ctx.access.role === 'admin' || ctx.access.role === 'exec';
  }

  private assertCanManage(meeting: MeetingDocument, ctx: Ctx) {
    if (this.isGlobal(ctx)) return;
    const dept = (meeting as any).departmentId;
    if (!dept || !ctx.managedDeptIds.has(String(dept))) {
      throw new ForbiddenException(
        'You can only manage meetings of your own departments',
      );
    }
  }

  // Hide meetingLink unless admin/exec or the meeting is in the user's department
  private maskLink(meeting: any, ctx: Ctx | null) {
    const deptId = meeting.departmentId?._id ?? meeting.departmentId;
    const visible =
      !!ctx &&
      (ctx.access.canSeeAllLinks ||
        (!!deptId && ctx.memberDeptIds.has(String(deptId))));
    return {
      ...meeting,
      meetingLink: visible ? meeting.meetingLink : null,
      linkVisible: visible,
    };
  }

  private async getContext(userId: string): Promise<Ctx> {
    const user: any = await this.userModel
      .findById(userId)
      .select('memberships activeMembershipId isAdmin role')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User not found');

    const access = resolveAccess(user);
    const memberDeptIds = new Set<string>(access.departmentIds);
    const managedDeptIds = new Set<string>();

    // from memberships
    (user.memberships ?? []).forEach((m: any) => {
      if (
        m.departmentId &&
        (m.role === 'Team Manager' || m.role === 'Responsable')
      ) {
        managedDeptIds.add(String(m.departmentId));
      }
    });

    // from the departments collection (source of truth for membership sync)
    if (Types.ObjectId.isValid(userId)) {
      const oid = new Types.ObjectId(userId);
      const depts: any[] = await this.departmentModel
        .find({
          $or: [
            { members: oid },
            { teamManagers: oid },
            { manager: oid },
            { viceManager: oid },
          ],
        })
        .select('_id teamManagers manager viceManager')
        .lean()
        .exec();

      depts.forEach((d) => {
        memberDeptIds.add(String(d._id));
        const manages =
          String(d.manager) === userId ||
          String(d.viceManager) === userId ||
          (d.teamManagers ?? []).some((t: any) => String(t) === userId);
        if (manages) managedDeptIds.add(String(d._id));
      });
    }

    return { access, memberDeptIds, managedDeptIds };
  }
}
