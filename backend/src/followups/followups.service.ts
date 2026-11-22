import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateFollowupNoteDto } from './dto/create-followup-note.dto';
import { UpdateFollowupNoteDto } from './dto/update-followup-note.dto';
import {
  FollowupNote,
  FollowupNoteDocument,
} from './schemas/followup-note.schema';

@Injectable()
export class FollowupsService {
  constructor(
    @InjectModel(FollowupNote.name)
    private readonly followupModel: Model<FollowupNoteDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  async findAll(userId: string, filters: any = {}) {
    const scope = await this.resolveScope(userId);
    const query: any = {};

    if (filters.departmentId) {
      query.departmentId = this.toObjectId(filters.departmentId, 'department');
    }
    if (filters.memberId) {
      query.memberId = this.toObjectId(filters.memberId, 'member');
    }
    if (filters.authorId) {
      query.author = this.toObjectId(filters.authorId, 'author');
    }
    if (filters.noteType) {
      this.validateNoteType(filters.noteType);
      query.noteType = filters.noteType;
    }
    if (filters.from || filters.to) {
      const from = filters.from
        ? this.parseDate(filters.from, 'from')
        : undefined;
      const to = filters.to ? this.parseDate(filters.to, 'to') : undefined;
      if (from && to && from > endOfDay(filters.to)) {
        throw new BadRequestException('The from date must not be after to');
      }
      query.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(filters.to ? { $lte: endOfDay(filters.to) } : {}),
      };
    }

    if (!scope.allowAllDepartments) {
      if (filteredId(filters.departmentId)) {
        if (!scope.allowedDepartmentIds.includes(String(filters.departmentId))) {
          throw new ForbiddenException(
            'You do not have access to this department',
          );
        }
        query.departmentId = new Types.ObjectId(filters.departmentId);
      } else {
        query.departmentId = {
          $in: scope.allowedDepartmentIds.map((id) => new Types.ObjectId(id)),
        };
      }
    }

    return this.followupModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email role')
      .lean()
      .exec();
  }

  async create(userId: string, dto: CreateFollowupNoteDto) {
    const text = dto.text?.trim();
    if (!text) {
      throw new BadRequestException('Note text is required');
    }

    const author = await this.userModel
      .findById(userId)
      .select('fullName memberships activeMembershipId role isAdmin')
      .lean()
      .exec();
    if (!author) throw new ForbiddenException('Authenticated user is invalid');

    const role = this.getActiveRole(author);
    const scope = await this.resolveScope(userId);
    this.validateNoteType(dto.noteType);
    await this.validateNoteAssociation(
      scope,
      dto.departmentId,
      dto.memberId,
    );

    const record = await this.followupModel.create({
      text,
      author: userId,
      authorName: author.fullName,
      authorRole: role,
      departmentId: dto.departmentId
        ? this.toObjectId(dto.departmentId, 'department')
        : null,
      memberId: dto.memberId
        ? this.toObjectId(dto.memberId, 'member')
        : null,
      noteType: dto.noteType ?? 'info',
    });

    return this.followupModel
      .findById(record._id)
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email role')
      .lean()
      .exec();
  }

  async update(userId: string, id: string, dto: UpdateFollowupNoteDto) {
    const noteId = this.toObjectId(id, 'note');
    const note = await this.followupModel.findById(noteId).exec();
    if (!note) throw new NotFoundException(`Follow-up note ${id} not found`);

    const user = await this.userModel
      .findById(userId)
      .select('isAdmin role memberships activeMembershipId')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('Authenticated user is invalid');

    const isOwner = String(note.author) === String(userId);
    const isAdmin =
      Boolean(user.isAdmin) || (user.role ?? []).includes('President');
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    const departmentId =
      dto.departmentId === undefined
        ? note.departmentId
          ? String(note.departmentId)
          : null
        : dto.departmentId;
    const memberId =
      dto.memberId === undefined
        ? note.memberId
          ? String(note.memberId)
          : null
        : dto.memberId;
    if (dto.departmentId !== undefined || dto.memberId !== undefined) {
      const scope = await this.resolveScope(userId);
      await this.validateNoteAssociation(scope, departmentId, memberId);
    }

    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) throw new BadRequestException('Note text cannot be empty');
      note.text = text;
    }
    if (dto.noteType !== undefined) {
      this.validateNoteType(dto.noteType);
      note.noteType = dto.noteType;
    }
    if (dto.departmentId !== undefined) {
      note.departmentId = dto.departmentId
        ? this.toObjectId(dto.departmentId, 'department')
        : null;
    }
    if (dto.memberId !== undefined) {
      note.memberId = dto.memberId
        ? this.toObjectId(dto.memberId, 'member')
        : null;
    }

    await note.save();
    return this.followupModel
      .findById(noteId)
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email role')
      .lean()
      .exec();
  }

  async remove(userId: string, id: string) {
    const noteId = this.toObjectId(id, 'note');
    const note = await this.followupModel.findById(noteId).exec();
    if (!note) throw new NotFoundException(`Follow-up note ${id} not found`);

    const user = await this.userModel
      .findById(userId)
      .select('isAdmin role')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('Authenticated user is invalid');

    const isOwner = String(note.author) === String(userId);
    const isAdmin =
      Boolean(user.isAdmin) || (user.role ?? []).includes('President');
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this note');
    }

    await this.followupModel.findByIdAndDelete(noteId).exec();
    return { deleted: true, id };
  }

  private async resolveScope(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('isAdmin role memberships activeMembershipId')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User not found');
    if (user.isAdmin || (user.role ?? []).includes('President')) {
      return { allowAllDepartments: true, allowedDepartmentIds: [] };
    }

    const role = this.getActiveRole(user);
    if (role === 'Director Executive') {
      return { allowAllDepartments: true, allowedDepartmentIds: [] };
    }

    const allowedDepartmentIds = new Set<string>();
    for (const membership of user.memberships ?? []) {
      if (
        membership.departmentId &&
        ['Team Manager', 'Responsable'].includes(membership.role)
      ) {
        allowedDepartmentIds.add(String(membership.departmentId));
      }
    }

    const assignedDepartments = await this.departmentModel
      .find({
        $or: [
          { manager: new Types.ObjectId(userId) },
          { viceManager: new Types.ObjectId(userId) },
          { teamManagers: new Types.ObjectId(userId) },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    assignedDepartments.forEach((department) =>
      allowedDepartmentIds.add(String(department._id)),
    );

    return {
      allowAllDepartments: false,
      allowedDepartmentIds: [...allowedDepartmentIds],
    };
  }

  private getActiveRole(user: any) {
    if (user.isAdmin || (user.role ?? []).includes('President')) {
      return 'President';
    }

    const activeMembership = (user.memberships ?? []).find(
      (membership: any) =>
        String(membership._id) === String(user.activeMembershipId),
    );
    return activeMembership?.role ?? 'Member';
  }

  private toObjectId(value: string, label: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
    return new Types.ObjectId(value);
  }

  private validateNoteType(noteType?: string) {
    if (
      noteType !== undefined &&
      !['info', 'warning', 'action'].includes(noteType)
    ) {
      throw new BadRequestException('Invalid follow-up note type');
    }
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${label} date`);
    }
    return date;
  }

  private async validateNoteAssociation(
    scope: { allowAllDepartments: boolean; allowedDepartmentIds: string[] },
    departmentId?: string | null,
    memberId?: string | null,
  ) {
    const departmentObjectId = departmentId
      ? this.toObjectId(departmentId, 'department')
      : null;
    if (departmentObjectId) {
      const exists = await this.departmentModel.exists({
        _id: departmentObjectId,
      });
      if (!exists) throw new BadRequestException('Department not found');
      if (
        !scope.allowAllDepartments &&
        !scope.allowedDepartmentIds.includes(String(departmentObjectId))
      ) {
        throw new ForbiddenException('This department is outside your scope');
      }
    }

    if (!memberId) return;
    const memberObjectId = this.toObjectId(memberId, 'member');
    const member = await this.userModel
      .findById(memberObjectId)
      .select('memberships departement')
      .lean()
      .exec();
    if (!member) throw new BadRequestException('Member not found');
    const memberDepartments = new Set<string>(
      (member.memberships ?? [])
        .filter((membership: any) => membership.departmentId)
        .map((membership: any) => String(membership.departmentId)),
    );
    (member.departement ?? []).forEach((id: Types.ObjectId) =>
      memberDepartments.add(String(id)),
    );
    const departmentAssignments = await this.departmentModel
      .find({
        $or: [
          { manager: memberObjectId },
          { viceManager: memberObjectId },
          { teamManagers: memberObjectId },
          { members: memberObjectId },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    departmentAssignments.forEach((department: any) =>
      memberDepartments.add(String(department._id)),
    );

    if (
      departmentObjectId &&
      !memberDepartments.has(String(departmentObjectId))
    ) {
      throw new BadRequestException(
        'The member does not belong to the selected department',
      );
    }
    if (
      !scope.allowAllDepartments &&
      !Array.from(memberDepartments).some((id) =>
        scope.allowedDepartmentIds.includes(id),
      )
    ) {
      throw new ForbiddenException('You cannot write a note for this member');
    }
  }
}

function filteredId(value?: string | null): boolean {
  return !!value;
}

function endOfDay(value: string): Date {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}
