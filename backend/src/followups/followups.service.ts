import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateFollowupNoteDto } from './dto/create-followup-note.dto';
import { UpdateFollowupNoteDto } from './dto/update-followup-note.dto';
import { FollowupNote } from './entities/followup-note.entity';

function endOfDay(value: string): Date {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

@Injectable()
export class FollowupsService {
  constructor(
    @InjectRepository(FollowupNote) private readonly followupRepo: Repository<FollowupNote>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
  ) {}

  async findAll(userId: string, filters: any = {}) {
    const scope = await this.resolveScope(userId);
    const qb = this.followupRepo.createQueryBuilder('n').orderBy('n.createdAt', 'DESC');

    if (filters.departmentId) qb.andWhere('n.department_id = :deptId', { deptId: Number(filters.departmentId) });
    if (filters.memberId) qb.andWhere('n.member_id = :memberId', { memberId: Number(filters.memberId) });
    if (filters.authorId) qb.andWhere('n.author = :authorId', { authorId: Number(filters.authorId) });
    if (filters.noteType) qb.andWhere('n.note_type = :noteType', { noteType: filters.noteType });
    if (filters.from) qb.andWhere('n.createdAt >= :from', { from: new Date(filters.from) });
    if (filters.to) qb.andWhere('n.createdAt <= :to', { to: endOfDay(filters.to) });

    if (!scope.allowAllDepartments) {
      const deptIds = scope.allowedDepartmentIds.map(Number);
      if (filters.departmentId) {
        if (!scope.allowedDepartmentIds.includes(String(filters.departmentId))) {
          throw new ForbiddenException('You do not have access to this department');
        }
      } else if (deptIds.length > 0) {
        qb.andWhere('n.department_id IN (:...deptIds)', { deptIds });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    return qb.getMany();
  }

  async create(userId: string, dto: CreateFollowupNoteDto) {
    const text = dto.text?.trim();
    if (!text) throw new BadRequestException('Note text is required');

    const author = await this.userRepo.findOne({
      where: { id: Number(userId) },
      relations: ['memberships'],
    });
    if (!author) throw new ForbiddenException('Authenticated user is invalid');

    const role = this.getActiveRole(author);
    const scope = await this.resolveScope(userId);

    if (dto.departmentId && !scope.allowAllDepartments && !scope.allowedDepartmentIds.includes(String(dto.departmentId))) {
      throw new ForbiddenException('This department is outside your scope');
    }

    if (dto.memberId) {
      const member = await this.userRepo.findOne({
        where: { id: Number(dto.memberId) },
        relations: ['memberships'],
      });
      if (!member) throw new BadRequestException('Member not found');
      const memberDepartments = (member.memberships ?? []).filter((m: any) => m.departmentId).map((m: any) => String(m.departmentId));
      if (dto.departmentId && !memberDepartments.includes(String(dto.departmentId))) {
        throw new BadRequestException('The member does not belong to the selected department');
      }
      if (!scope.allowAllDepartments && !memberDepartments.some((id) => scope.allowedDepartmentIds.includes(id))) {
        throw new ForbiddenException('You cannot write a note for this member');
      }
    }

    const note = this.followupRepo.create({
      text,
      author: Number(userId),
      authorName: author.fullName,
      authorRole: role,
      departmentId: dto.departmentId ? Number(dto.departmentId) : null,
      memberId: dto.memberId ? Number(dto.memberId) : null,
      noteType: dto.noteType ?? 'info',
    } as Partial<FollowupNote>);

    return this.followupRepo.save(note);
  }

  async update(userId: string, id: string, dto: UpdateFollowupNoteDto) {
    const note = await this.followupRepo.findOne({ where: { id: Number(id) } });
    if (!note) throw new NotFoundException(`Follow-up note ${id} not found`);

    const user = await this.userRepo.findOne({ where: { id: Number(userId) } });
    if (!user) throw new ForbiddenException('Authenticated user is invalid');

    const isOwner = note.author === Number(userId);
    const isAdmin = Boolean(user.isAdmin) || (user.role ?? []).includes('President');
    if (!isOwner && !isAdmin) throw new ForbiddenException('You can only edit your own notes');

    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) throw new BadRequestException('Note text cannot be empty');
      note.text = text;
    }
    if (dto.noteType) note.noteType = dto.noteType;
    if (dto.departmentId) note.departmentId = Number(dto.departmentId);
    if (dto.memberId) note.memberId = Number(dto.memberId);

    return this.followupRepo.save(note);
  }

  async remove(userId: string, id: string) {
    const note = await this.followupRepo.findOne({ where: { id: Number(id) } });
    if (!note) throw new NotFoundException(`Follow-up note ${id} not found`);

    const user = await this.userRepo.findOne({ where: { id: Number(userId) } });
    if (!user) throw new ForbiddenException('Authenticated user is invalid');

    const isOwner = note.author === Number(userId);
    const isAdmin = Boolean(user.isAdmin) || (user.role ?? []).includes('President');
    if (!isOwner && !isAdmin) throw new ForbiddenException('You are not allowed to delete this note');

    await this.followupRepo.remove(note);
    return { deleted: true, id };
  }

  private async resolveScope(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: Number(userId) }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User not found');
    if (user.isAdmin || (user.role ?? []).includes('President')) {
      return { allowAllDepartments: true, allowedDepartmentIds: [] };
    }

    const role = this.getActiveRole(user);
    const allowedDepartmentIds = new Set<string>();
    for (const membership of user.memberships ?? []) {
      if ((membership as any).departmentId) allowedDepartmentIds.add(String((membership as any).departmentId));
    }

    if (role === 'Director Executive') {
      return { allowAllDepartments: true, allowedDepartmentIds: [] };
    }

    return { allowAllDepartments: false, allowedDepartmentIds: [...allowedDepartmentIds] };
  }

  private getActiveRole(user: any): string {
    const activeMembership = (user.memberships ?? []).find(
      (m: any) => m.id === user.activeMembershipId,
    );
    return activeMembership?.role ?? 'Member';
  }
}
