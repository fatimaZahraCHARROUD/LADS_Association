import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategicPlan } from './entities/strategic-plan.entity';
import { CreateStrategicPlanDto } from './dto/create-strategic-plan.dto';
import { UpdateStrategicPlanDto } from './dto/update-strategic-plan.dto';

@Injectable()
export class StrategicPlansService {
  constructor(
    @InjectRepository(StrategicPlan) private planRepo: Repository<StrategicPlan>,
  ) {}

  create(dto: CreateStrategicPlanDto, userId: string) {
    const plan = this.planRepo.create({
      ...dto,
      createdBy: Number(userId),
    } as Partial<StrategicPlan>);
    return this.planRepo.save(plan);
  }

  findAll(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    return this.planRepo.find({ where, order: { deadline: 'ASC' } });
  }

  async findOne(id: string) {
    const plan = await this.planRepo.findOne({ where: { id: Number(id) } });
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    return plan;
  }

  async update(id: string, dto: UpdateStrategicPlanDto) {
    const plan = await this.planRepo.findOne({ where: { id: Number(id) } });
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    const { createdBy: _, ...safe } = dto as any;
    Object.assign(plan, safe);
    return this.planRepo.save(plan);
  }

  async updateStatus(id: string, status: string) {
    const plan = await this.planRepo.findOne({ where: { id: Number(id) } });
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    plan.status = status;
    return this.planRepo.save(plan);
  }

  async remove(id: string) {
    const plan = await this.planRepo.findOne({ where: { id: Number(id) } });
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    await this.planRepo.remove(plan);
    return { message: 'Strategic plan deleted' };
  }
}
