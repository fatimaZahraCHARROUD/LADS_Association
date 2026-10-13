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

    if (filteredId(filters.departmentId)) {
      query.departmentId = new Types.ObjectId(filters.departmentId);
    }
    if (filteredId(filters.memberId)) {
      query.memberId = new Types.ObjectId(filters.memberId);
    }
    if (filters.authorId) {
      query.author = new Types.ObjectId(filters.authorId);
    }
    if (filters.noteType) {
      query.noteType = filters.noteType;
    }
    if (filters.from || filters.to) {
      query.createdAt = {
        ...(filters.from ? { $gte: new Date(filters.from) } : {}),
        ...(filters.to ? { $lte: new Date(filters.to) } : {}),
      };
    }

    if (!scope.allowAllDepartments) {
      query.departmentId = {
        $in: scope.allowedDepartmentIds.map((id) => new Types.ObjectId(id)),
      };
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

    if (
      dto.departmentId &&
      !scope.allowAllDepartments &&
      !scope.allowedDepartmentIds.includes(String(dto.departmentId))
    ) {
      throw new ForbiddenException('This department is outside your scope');
    }

    if (dto.memberId) {
      const member = await this.userModel
        .findById(dto.memberId)
        .select('memberships')
        .lean()
        .exec();
      if (!member) throw new BadRequestException('Member not found');
      const memberDepartments = (member.memberships ?? [])
        .filter((membership: any) => membership.departmentId)
        .map((membership: any) => String(membership.departmentId));
      if (
        dto.departmentId &&
        !memberDepartments.includes(String(dto.departmentId))
      ) {
        throw new BadRequestException(
          'The member does not belong to the selected department',
        );
      }
      if (
        !scope.allowAllDepartments &&
        !memberDepartments.some((departmentId) =>
          scope.allowedDepartmentIds.includes(departmentId),
        )
      ) {
        throw new ForbiddenException('You cannot write a note for this member');
      }
    }

    const record = await this.followupModel.create({
      text,
      author: userId,
      authorName: author.fullName,
      authorRole: role,
      departmentId: dto.departmentId ?? null,
      memberId: dto.memberId ?? null,
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
    const note = await this.followupModel.findById(id).exec();
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

    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) throw new BadRequestException('Note text cannot be empty');
      note.text = text;
    }
    if (dto.noteType) note.noteType = dto.noteType;
    if (dto.departmentId)
      note.departmentId = new Types.ObjectId(dto.departmentId);
    if (dto.memberId) note.memberId = new Types.ObjectId(dto.memberId);

    await note.save();
    return this.followupModel
      .findById(id)
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email role')
      .lean()
      .exec();
  }

  async remove(userId: string, id: string) {
    const note = await this.followupModel.findById(id).exec();
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

    await this.followupModel.findByIdAndDelete(id).exec();
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
    const allowedDepartmentIds = new Set<string>();
    for (const membership of user.memberships ?? []) {
      if (membership.departmentId)
        allowedDepartmentIds.add(String(membership.departmentId));
    }

    if (role === 'Director Executive') {
      return { allowAllDepartments: true, allowedDepartmentIds: [] };
    }

    return {
      allowAllDepartments: false,
      allowedDepartmentIds: [...allowedDepartmentIds],
    };
  }

  private getActiveRole(user: any) {
    const activeMembership = (user.memberships ?? []).find(
      (membership: any) =>
        String(membership._id) === String(user.activeMembershipId),
    );
    return activeMembership?.role ?? 'Member';
  }
}

function filteredId(value?: string | null): boolean {
  return !!value && Types.ObjectId.isValid(value);
}
