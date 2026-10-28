import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LadsDocument, LadsDocumentDocument } from './schemas/document.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  AccessContext,
  loadAccessContext,
} from '../services/jwt/access-context';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(LadsDocument.name)
    private documentModel: Model<LadsDocumentDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // ───────── helpers ─────────

  private ctx(userId: string): Promise<AccessContext> {
    return loadAccessContext(this.userModel, this.departmentModel, userId);
  }

  private isGlobal(ctx: AccessContext) {
    return ctx.access.role === 'admin' || ctx.access.role === 'exec';
  }

  private idOf(v: any): string {
    return String(v?._id ?? v);
  }

  private validateVisibility(dto: CreateDocumentDto | UpdateDocumentDto) {
    if (dto.visibility === 'department' && !dto.visibilityDepartment) {
      throw new BadRequestException(
        'visibilityDepartment is required when visibility is "department"',
      );
    }
    if (dto.visibility === 'member' && !dto.visibilityMember) {
      throw new BadRequestException(
        'visibilityMember is required when visibility is "member"',
      );
    }
  }

  // Non-global writers can only target departments they manage
  private assertDepartmentAllowed(
    dto: CreateDocumentDto | UpdateDocumentDto,
    ctx: AccessContext,
  ) {
    if (this.isGlobal(ctx)) return;
    if (
      (dto.visibility === 'department' || dto.visibilityDepartment) &&
      dto.visibilityDepartment &&
      !ctx.managedDeptIds.has(String(dto.visibilityDepartment))
    ) {
      throw new ForbiddenException(
        'You can only share documents with departments you manage',
      );
    }
  }

  private canView(doc: any, ctx: AccessContext): boolean {
    if (this.idOf(doc.uploadedBy) === ctx.userId) return true;
    if (doc.visibility === 'private') return false;
    if (ctx.access.role === 'admin') return true;
    switch (doc.visibility) {
      case 'all':
        return true;
      case 'department':
        return ctx.memberDeptIds.has(this.idOf(doc.visibilityDepartment));
      case 'member':
        return this.idOf(doc.visibilityMember) === ctx.userId;
      default:
        return false;
    }
  }

  private canManage(doc: any, ctx: AccessContext): boolean {
    if (!this.canView(doc, ctx)) return false;
    if (this.isGlobal(ctx)) return true;
    if (this.idOf(doc.uploadedBy) === ctx.userId) return true;
    return (
      doc.visibility === 'department' &&
      ctx.managedDeptIds.has(this.idOf(doc.visibilityDepartment))
    );
  }

  private async loadForWrite(id: string, userId: string) {
    const existing = await this.documentModel.findById(id).lean().exec();
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    const ctx = await this.ctx(userId);
    if (!this.canView(existing, ctx)) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    if (!this.canManage(existing, ctx)) {
      throw new ForbiddenException('You cannot modify this document');
    }
    return { existing, ctx };
  }

  // ───────── CRUD ─────────

  async create(dto: CreateDocumentDto, userId: string) {
    this.validateVisibility(dto);
    const ctx = await this.ctx(userId);
    this.assertDepartmentAllowed(dto, ctx);
    return this.documentModel.create({
      ...dto,
      uploadedBy: userId,
    });
  }

  async findAll(userId: string, category?: string) {
    const ctx = await this.ctx(userId);

    const filter: Record<string, unknown> =
      ctx.access.role === 'admin'
        ? {
            $or: [
              { visibility: { $ne: 'private' } },
              { uploadedBy: userId },
            ],
          }
        : {
            $or: [
              { visibility: 'all' },
              { uploadedBy: userId },
              {
                visibility: 'department',
                visibilityDepartment: { $in: [...ctx.memberDeptIds] },
              },
              { visibility: 'member', visibilityMember: userId },
            ],
          };
    if (category) filter.category = category;

    return this.documentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName email')
      .populate('visibilityDepartment', 'name')
      .populate('visibilityMember', 'fullName email')
      .exec();
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentModel
      .findById(id)
      .populate('uploadedBy', 'fullName email')
      .populate('visibilityDepartment', 'name')
      .populate('visibilityMember', 'fullName email')
      .exec();
    if (!document) throw new NotFoundException(`Document ${id} not found`);

    const ctx = await this.ctx(userId);
    if (!this.canView(document, ctx)) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const { ctx } = await this.loadForWrite(id, userId);
    if (dto.visibility) this.validateVisibility(dto);
    this.assertDepartmentAllowed(dto, ctx);

    const safe: Record<string, unknown> = { ...dto };
    delete safe.uploadedBy;
    return this.documentModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  async remove(id: string, userId: string) {
    await this.loadForWrite(id, userId);
    await this.documentModel.findByIdAndDelete(id).exec();
    return { message: 'Document deleted' };
  }

  // ───────── form options ─────────

  listDepartmentOptions() {
    return this.departmentModel
      .find()
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  // Uses memberships AND the departments collection (fixes empty preselect)
  async listMyDepartments(userId: string) {
    const ctx = await this.ctx(userId);
    const ids = [...ctx.memberDeptIds].map((i) => new Types.ObjectId(i));
    return this.departmentModel
      .find({ _id: { $in: ids } })
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();
  }
}
