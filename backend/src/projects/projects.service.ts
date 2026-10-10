import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Project, ProjectDocument, PROJECT_STATUSES } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  private assertId(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid id');
  }

  private assertDates(start: unknown, end: unknown) {
    if (start && end && new Date(end as string) < new Date(start as string)) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }

  private fail(err: unknown): never {
    if (err instanceof Error && err.name === 'ValidationError') {
      throw new BadRequestException(err.message);
    }
    throw err;
  }

  async create(dto: CreateProjectDto, userId: string) {
    this.assertDates(dto.startDate, dto.endDate);
    try {
      return await this.projectModel.create({
        ...dto,
        departmentId: dto.departmentId || null,
        createdBy: userId,
      });
    } catch (err) {
      this.fail(err);
    }
  }

  findAll(filter: { status?: string; departmentId?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.departmentId) query.departmentId = filter.departmentId;
    return this.projectModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('managerIds', 'fullName email')
      .populate('memberIds', 'fullName email')
      .populate('departmentId', 'name')
      .populate('createdBy', 'fullName email')
      .exec();
  }

  async findOne(id: string) {
    this.assertId(id);
    const project = await this.projectModel
      .findById(id)
      .populate('managerIds', 'fullName email')
      .populate('memberIds', 'fullName email')
      .populate('departmentId', 'name')
      .populate('createdBy', 'fullName email')
      .exec();
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    this.assertId(id);
    const existing = await this.projectModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const data: Record<string, unknown> = { ...dto };
    delete data.createdBy; // l'auteur ne change jamais
    if ('departmentId' in data) data.departmentId = data.departmentId || null;

    this.assertDates(
      dto.startDate ?? existing.startDate,
      dto.endDate ?? existing.endDate,
    );
    try {
      return await this.projectModel
        .findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .exec();
    } catch (err) {
      this.fail(err);
    }
  }

  async updateProgress(id: string, body: { status?: string; progress?: number }) {
    this.assertId(id);
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!(PROJECT_STATUSES as readonly string[]).includes(body.status)) {
        throw new BadRequestException(
          `status must be one of: ${PROJECT_STATUSES.join(', ')}`,
        );
      }
      data.status = body.status;
    }
    if (body.progress !== undefined) {
      const p = Number(body.progress);
      if (!Number.isFinite(p) || p < 0 || p > 100) {
        throw new BadRequestException('progress must be a number between 0 and 100');
      }
      data.progress = p;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Send status and/or progress');
    }

    const project = await this.projectModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }
    async togglePublish(id: string) {
    this.assertId(id);
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    project.isPublished = !project.isPublished;
    return project.save();
  }

  // Public site: published projects only, without any private data
  // (no members, no emails, no Drive link).
  findPublished() {
    return this.projectModel
      .find({ isPublished: true })
      .select('title description img departmentId startDate endDate status progress')
      .populate('departmentId', 'name')
      .sort({ startDate: -1 })
      .exec();
  }
  async remove(id: string) {
    this.assertId(id);
    const project = await this.projectModel.findByIdAndDelete(id).exec();
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return { message: 'Project deleted' };
  }
}