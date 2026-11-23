import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { resolveAccess, EffectiveAccess } from '../services/jwt/effective-role';

interface Ctx {
  access: EffectiveAccess;
  memberDeptIds: Set<string>;
  managedDeptIds: Set<string>;
}

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting) private meetingRepo: Repository<Meeting>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateMeetingDto, userId: string) {
    const ctx = await this.getContext(userId);
    let departmentId: number | null = dto.departmentId ? Number(dto.departmentId) : null;

    if (!this.isGlobal(ctx)) {
      if (!departmentId) {
        const active = ctx.access.activeDepartmentId;
        if (active && ctx.managedDeptIds.has(active)) departmentId = Number(active);
        else if (ctx.managedDeptIds.size === 1) departmentId = Number([...ctx.managedDeptIds][0]);
      }
      if (!departmentId || !ctx.managedDeptIds.has(String(departmentId))) {
        throw new ForbiddenException('You can only manage meetings of your own departments');
      }
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('End time must be after start time');
    }

    const meeting = this.meetingRepo.create({
      ...dto,
      startAt,
      endAt,
      departmentId,
      createdBy: Number(userId),
    } as Partial<Meeting>);
    return this.meetingRepo.save(meeting);
  }

  async findAll(from?: string, to?: string, userId?: string) {
    const qb = this.meetingRepo.createQueryBuilder('m').orderBy('m.startAt', 'ASC');
    if (from) qb.andWhere('m.startAt >= :from', { from: new Date(from) });
    if (to) qb.andWhere('m.startAt <= :to', { to: new Date(to) });
    const meetings = await qb.getMany();

    const ctx = userId ? await this.getContext(userId) : null;
    return meetings.map((m) => this.maskLink(m, ctx));
  }

  async findOne(id: string, userId?: string) {
    const meeting = await this.meetingRepo.findOne({ where: { id: Number(id) } });
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);
    const ctx = userId ? await this.getContext(userId) : null;
    return this.maskLink(meeting, ctx);
  }

  async update(id: string, dto: UpdateMeetingDto, userId: string) {
    const existing = await this.meetingRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);

    const ctx = await this.getContext(userId);
    this.assertCanManage(existing, ctx);

    const { createdBy: _, department: __, ...safe } = dto as any;
    if (safe.departmentId && !this.isGlobal(ctx) && !ctx.managedDeptIds.has(String(safe.departmentId))) {
      throw new ForbiddenException('You can only manage meetings of your own departments');
    }

    Object.assign(existing, safe);
    return this.meetingRepo.save(existing);
  }

  async remove(id: string, userId: string) {
    const existing = await this.meetingRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    const ctx = await this.getContext(userId);
    this.assertCanManage(existing, ctx);
    await this.meetingRepo.remove(existing);
    return { message: 'Meeting deleted' };
  }

  async listWritableDepartments(userId: string) {
    const ctx = await this.getContext(userId);
    if (this.isGlobal(ctx)) return this.departmentRepo.find({ select: { id: true, name: true } as any, order: { name: 'ASC' } });
    const ids = [...ctx.managedDeptIds].map(Number).filter(Boolean);
    if (!ids.length) return [];
    return this.departmentRepo.find({ where: { id: ids as any }, select: { id: true, name: true } as any, order: { name: 'ASC' } });
  }

  private isGlobal(ctx: Ctx): boolean {
    return ctx.access.role === 'admin' || ctx.access.role === 'exec';
  }

  private assertCanManage(meeting: Meeting, ctx: Ctx) {
    if (this.isGlobal(ctx)) return;
    if (!meeting.departmentId || !ctx.managedDeptIds.has(String(meeting.departmentId))) {
      throw new ForbiddenException('You can only manage meetings of your own departments');
    }
  }

  private maskLink(meeting: any, ctx: Ctx | null) {
    const deptId = meeting.departmentId;
    const visible =
      !!ctx &&
      (ctx.access.canSeeAllLinks || (!!deptId && ctx.memberDeptIds.has(String(deptId))));
    return { ...meeting, meetingLink: visible ? meeting.meetingLink : null, linkVisible: visible };
  }

  private async getContext(userId: string): Promise<Ctx> {
    const user = await this.userRepo.findOne({
      where: { id: Number(userId) },
      relations: ['memberships'],
    });
    if (!user) throw new ForbiddenException('User not found');

    const access = resolveAccess(user);
    const memberDeptIds = new Set<string>(access.departmentIds);
    const managedDeptIds = new Set<string>();

    (user.memberships ?? []).forEach((m: any) => {
      if (m.departmentId && (m.role === 'Team Manager' || m.role === 'Responsable')) {
        managedDeptIds.add(String(m.departmentId));
      }
    });

    const numId = Number(userId);
    const depts = await this.departmentRepo
      .createQueryBuilder('d')
      .where(
        `JSON_CONTAINS(d.members, :uid) OR JSON_CONTAINS(d.team_managers, :uid) OR d.manager = :nid OR d.vice_manager = :nid`,
        { uid: JSON.stringify(numId), nid: numId },
      )
      .select(['d.id', 'd.teamManagers', 'd.manager', 'd.viceManager'])
      .getMany();

    depts.forEach((d) => {
      memberDeptIds.add(String(d.id));
      const manages =
        d.manager === numId ||
        d.viceManager === numId ||
        (d.teamManagers ?? []).includes(numId);
      if (manages) managedDeptIds.add(String(d.id));
    });

    return { access, memberDeptIds, managedDeptIds };
  }
}
