import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StrategicPlan,
  StrategicPlanDocument,
} from './schemas/strategic-plan.schema';
import { CreateStrategicPlanDto } from './dto/create-strategic-plan.dto';
import { UpdateStrategicPlanDto } from './dto/update-strategic-plan.dto';

@Injectable()
export class StrategicPlansService {
  constructor(
    @InjectModel(StrategicPlan.name)
    private planModel: Model<StrategicPlanDocument>,
  ) {}

  create(dto: CreateStrategicPlanDto, userId: string) {
    return this.planModel.create({ ...dto, createdBy: userId });
  }

  findAll(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.planModel
      .find(filter)
      .sort({ deadline: 1 })
      .populate('createdBy', 'fullName email')
      .exec();
  }

  async findOne(id: string) {
    const plan = await this.planModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .exec();
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    return plan;
  }

  async update(id: string, dto: UpdateStrategicPlanDto) {
    const safe: Record<string, unknown> = { ...dto };
    delete safe.createdBy; // on ne laisse jamais changer l'auteur
    const plan = await this.planModel
      .findByIdAndUpdate(id, safe, { new: true, runValidators: true })
      .exec();
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    return plan;
  }

  async updateStatus(id: string, status: string) {
    const plan = await this.planModel
      .findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .exec();
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    return plan;
  }

  async remove(id: string) {
    const plan = await this.planModel.findByIdAndDelete(id).exec();
    if (!plan) throw new NotFoundException(`Strategic plan ${id} not found`);
    return { message: 'Strategic plan deleted' };
  }
}