import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LadsInfo, LadsInfoDocument } from './schemas/lads-info.schema';
import { CreateLadsInfoDto } from './dto/create-lads-info.dto';
import { UpdateLadsInfoDto } from './dto/update-lads-info.dto';

@Injectable()
export class LadsInfoService {
  constructor(@InjectModel(LadsInfo.name) private ladsInfoModel: Model<LadsInfoDocument>) {}

  create(dto: CreateLadsInfoDto) {
    return this.ladsInfoModel.create(dto);
  }

  findAll() {
    return this.ladsInfoModel.find().exec();
  }

  async findOne(id: string) {
    const info = await this.ladsInfoModel.findById(id).exec();
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    return info;
  }

  async update(id: string, dto: UpdateLadsInfoDto) {
    const info = await this.ladsInfoModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    return info;
  }

  async remove(id: string) {
    const info = await this.ladsInfoModel.findByIdAndDelete(id).exec();
    if (!info) throw new NotFoundException(`LadsInfo ${id} not found`);
    return { deleted: true };
  }
}
