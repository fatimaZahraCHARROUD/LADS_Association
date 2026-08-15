import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LadsDocument, LadsDocumentDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(LadsDocument.name)
    private documentModel: Model<LadsDocumentDocument>,
  ) {}

  create(dto: CreateDocumentDto) {
    return this.documentModel.create(dto);
  }

  findAll(department?: string, category?: string) {
    const filter: Record<string, unknown> = {};
    if (department) filter.department = department;
    if (category) filter.category = category;
    return this.documentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async findOne(id: string) {
    const document = await this.documentModel
      .findById(id)
      .populate('uploadedBy', 'fullName email')
      .exec();
    if (!document) throw new NotFoundException(`Document ${id} not found`);
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const existing = await this.documentModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    return this.documentModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(id: string) {
    const existing = await this.documentModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    await this.documentModel.findByIdAndDelete(id).exec();
    return { message: 'Document deleted' };
  }
}
