import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_STATUSES = ['planned', 'in_progress', 'completed', 'on_hold'] as const;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  private assertDates(start: unknown, end: unknown) {
    if (start && end && new Date(end as string) < new Date(start as string)) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }

  async create(dto: CreateProjectDto, userId: string) {
    this.assertDates(dto.startDate, dto.endDate);
    const project = this.projectRepo.create({
      ...dto,
      departmentId: dto.departmentId ? Number(dto.departmentId) : null,
      createdBy: Number(userId),
    } as Partial<Project>);
    return this.projectRepo.save(project);
  }

  findAll(filter: { status?: string; departmentId?: string } = {}) {
    const where: Record<string, unknown> = {};
    if (filter.status) where['status'] = filter.status;
    if (filter.departmentId) where['departmentId'] = Number(filter.departmentId);
    return this.projectRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const project = await this.projectRepo.findOne({ where: { id: Number(id) } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.projectRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const { createdBy: _, ...data } = dto as any;
    if ('departmentId' in data) data.departmentId = data.departmentId ? Number(data.departmentId) : null;
    this.assertDates(data.startDate ?? existing.startDate, data.endDate ?? existing.endDate);

    Object.assign(existing, data);
    return this.projectRepo.save(existing);
  }

  async updateProgress(id: string, body: { status?: string; progress?: number }) {
    const project = await this.projectRepo.findOne({ where: { id: Number(id) } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    if (body.status !== undefined) {
      if (!(PROJECT_STATUSES as readonly string[]).includes(body.status)) {
        throw new BadRequestException(`status must be one of: ${PROJECT_STATUSES.join(', ')}`);
      }
      project.status = body.status;
    }
    if (body.progress !== undefined) {
      const p = Number(body.progress);
      if (!Number.isFinite(p) || p < 0 || p > 100) {
        throw new BadRequestException('progress must be a number between 0 and 100');
      }
      project.progress = p;
    }

    return this.projectRepo.save(project);
  }

  async togglePublish(id: string) {
    const project = await this.projectRepo.findOne({ where: { id: Number(id) } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    project.isPublished = !project.isPublished;
    return this.projectRepo.save(project);
  }

  findPublished() {
    return this.projectRepo.find({ where: { isPublished: true }, order: { startDate: 'DESC' } });
  }

  async remove(id: string) {
    const project = await this.projectRepo.findOne({ where: { id: Number(id) } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    await this.projectRepo.remove(project);
    return { message: 'Project deleted' };
  }
}
