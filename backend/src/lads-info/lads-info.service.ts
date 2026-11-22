import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LadsInfo } from './entities/lads-info.entity';
import { CreateLadsInfoDto } from './dto/create-lads-info.dto';
import { UpdateLadsInfoDto } from './dto/update-lads-info.dto';

@Injectable()
export class LadsInfoService {
  constructor(
    @InjectRepository(LadsInfo) private ladsInfoRepo: Repository<LadsInfo>,
  ) {}

  create(dto: CreateLadsInfoDto) {
    const info = this.ladsInfoRepo.create(dto as Partial<LadsInfo>);
    return this.ladsInfoRepo.save(info);
  }

  findAll() {
    return this.ladsInfoRepo.find();
  }

  async findOne(id: string) {
    const info = await this.ladsInfoRepo.findOne({ where: { id: Number(id) } });
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    return info;
  }

  async update(id: string, dto: UpdateLadsInfoDto) {
    const info = await this.ladsInfoRepo.findOne({ where: { id: Number(id) } });
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    Object.assign(info, dto);
    return this.ladsInfoRepo.save(info);
  }

  async remove(id: string) {
    const info = await this.ladsInfoRepo.findOne({ where: { id: Number(id) } });
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    await this.ladsInfoRepo.remove(info);
    return { deleted: true };
  }
}
