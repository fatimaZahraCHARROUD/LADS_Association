import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LadsDocument } from './entities/document.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AccessContext, loadAccessContext } from '../services/jwt/access-context';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(LadsDocument) private documentRepo: Repository<LadsDocument>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private ctx(userId: string): Promise<AccessContext> {
    return loadAccessContext(this.userRepo, this.departmentRepo, userId);
  }

  private isGlobal(ctx: AccessContext) {
    return ctx.access.role === 'admin' || ctx.access.role === 'exec';
  }

  private idOf(v: any): string {
    return String(v?._id ?? v?.id ?? v);
  }

  private validateVisibility(dto: CreateDocumentDto | UpdateDocumentDto) {
    if (dto.visibility === 'department' && !dto.visibilityDepartment) {
      throw new BadRequestException('visibilityDepartment is required when visibility is "department"');
    }
    if (dto.visibility === 'member' && !dto.visibilityMember) {
      throw new BadRequestException('visibilityMember is required when visibility is "member"');
    }
  }

  private assertDepartmentAllowed(dto: CreateDocumentDto | UpdateDocumentDto, ctx: AccessContext) {
    if (this.isGlobal(ctx)) return;
    if (
      (dto.visibility === 'department' || dto.visibilityDepartment) &&
      dto.visibilityDepartment &&
      !ctx.managedDeptIds.has(String(dto.visibilityDepartment))
    ) {
      throw new ForbiddenException('You can only share documents with departments you manage');
    }
  }

  private canView(doc: LadsDocument, ctx: AccessContext): boolean {
    if (String(doc.uploadedBy) === ctx.userId) return true;
    if (doc.visibility === 'private') return false;
    if (ctx.access.role === 'admin') return true;
    switch (doc.visibility) {
      case 'all': return true;
      case 'department': return ctx.memberDeptIds.has(String(doc.visibilityDepartment));
      case 'member': return String(doc.visibilityMember) === ctx.userId;
      default: return false;
    }
  }

  private canManage(doc: LadsDocument, ctx: AccessContext): boolean {
    if (!this.canView(doc, ctx)) return false;
    if (this.isGlobal(ctx)) return true;
    if (String(doc.uploadedBy) === ctx.userId) return true;
    return doc.visibility === 'department' && ctx.managedDeptIds.has(String(doc.visibilityDepartment));
  }

  private async loadForWrite(id: string, userId: string) {
    const existing = await this.documentRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    const ctx = await this.ctx(userId);
    if (!this.canView(existing, ctx)) throw new NotFoundException(`Document ${id} not found`);
    if (!this.canManage(existing, ctx)) throw new ForbiddenException('You cannot modify this document');
    return { existing, ctx };
  }

  async create(dto: CreateDocumentDto, userId: string) {
    this.validateVisibility(dto);
    const ctx = await this.ctx(userId);
    this.assertDepartmentAllowed(dto, ctx);
    const doc = this.documentRepo.create({
      ...dto,
      uploadedBy: Number(userId),
    } as Partial<LadsDocument>);
    return this.documentRepo.save(doc);
  }

  async findAll(userId: string, category?: string) {
    const ctx = await this.ctx(userId);
    const qb = this.documentRepo.createQueryBuilder('doc');
    const numId = Number(userId);

    if (ctx.access.role === 'admin') {
      qb.where('doc.visibility != :priv OR doc.uploaded_by = :uid', { priv: 'private', uid: numId });
    } else {
      const deptIds = [...ctx.memberDeptIds].map(Number).filter(Boolean);
      qb.where(
        `doc.visibility = 'all' OR doc.uploaded_by = :uid OR (doc.visibility = 'member' AND doc.visibility_member = :uid)`,
        { uid: numId },
      );
      if (deptIds.length > 0) {
        qb.orWhere(
          `doc.visibility = 'department' AND doc.visibility_department IN (:...deptIds)`,
          { deptIds },
        );
      }
    }

    if (category) qb.andWhere('doc.category = :category', { category });
    qb.orderBy('doc.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentRepo.findOne({ where: { id: Number(id) } });
    if (!document) throw new NotFoundException(`Document ${id} not found`);
    const ctx = await this.ctx(userId);
    if (!this.canView(document, ctx)) throw new NotFoundException(`Document ${id} not found`);
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const { existing, ctx } = await this.loadForWrite(id, userId);
    if (dto.visibility) this.validateVisibility(dto);
    this.assertDepartmentAllowed(dto, ctx);
    const { uploadedBy: _, ...safe } = dto as any;
    Object.assign(existing, safe);
    return this.documentRepo.save(existing);
  }

  async remove(id: string, userId: string) {
    const { existing } = await this.loadForWrite(id, userId);
    await this.documentRepo.remove(existing);
    return { message: 'Document deleted' };
  }

  listDepartmentOptions() {
    return this.departmentRepo.find({ select: { id: true, name: true }, order: { name: 'ASC' } });
  }

  async listWritableDepartments(userId: string) {
    const ctx = await this.ctx(userId);
    if (this.isGlobal(ctx)) {
      return this.departmentRepo.find({ select: { id: true, name: true }, order: { name: 'ASC' } });
    }
    const ids = [...ctx.managedDeptIds].map(Number).filter(Boolean);
    if (!ids.length) return [];
    return this.departmentRepo.find({ where: { id: ids as any }, select: { id: true, name: true }, order: { name: 'ASC' } });
  }

  async listMyDepartments(userId: string) {
    const ctx = await this.ctx(userId);
    const ids = [...ctx.memberDeptIds].map(Number).filter(Boolean);
    if (!ids.length) return [];
    return this.departmentRepo.find({ where: { id: ids as any }, select: { id: true, name: true }, order: { name: 'ASC' } });
  }
}
