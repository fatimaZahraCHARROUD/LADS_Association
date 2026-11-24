import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation) private formationRepo: Repository<Formation>,
    private uploadService: UploadService,
  ) {}

  create(dto: CreateFormationDto) {
    const formation = this.formationRepo.create(dto as Partial<Formation>);
    return this.formationRepo.save(formation);
  }

  findAll(status?: string, isPublished?: boolean) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    return this.formationRepo.find({ where, order: { date: 'DESC' } });
  }

  findForMembers() {
    return this.formationRepo.find({ where: { isPublished: true }, order: { date: 'DESC' } });
  }

  findAllForAdmin() {
    return this.formationRepo.find({ order: { date: 'DESC' } });
  }

  async findOne(id: string) {
    const formation = await this.formationRepo.findOne({ where: { id: Number(id) } });
    if (!formation) throw new NotFoundException(`Formation ${id} not found`);
    return formation;
  }

  async update(id: string, dto: UpdateFormationDto) {
    const existing = await this.formationRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Formation ${id} not found`);

    if (dto.imgUrl && existing.imgUrl && dto.imgUrl !== existing.imgUrl) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(existing.coverImagePublicId);
      }
    }

    Object.assign(existing, dto);
    return this.formationRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.formationRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Formation ${id} not found`);

    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(existing.coverImagePublicId);
    }

    await this.formationRepo.remove(existing);
    return { message: 'Formation deleted' };
  }

  async togglePublish(id: string) {
    const formation = await this.formationRepo.findOne({ where: { id: Number(id) } });
    if (!formation) throw new NotFoundException(`Formation ${id} not found`);
    formation.isPublished = !formation.isPublished;
    return this.formationRepo.save(formation);
  }
}
