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

  async create(dto: CreateDocumentDto, userId: string) {
    return this.documentModel.create({
      ...dto,
      uploadedBy: userId,
    });
  }

  async findAll(userId: string, category?: string) {
    // Public docs → everyone sees them
    // Private docs → only the uploader sees them
    const filter: Record<string, unknown> = {
      $or: [
        { visibility: { $ne: 'private' } },
        { uploadedBy: userId },
      ],
    };
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
    const safe: Record<string, unknown> = { ...dto };
    delete safe.uploadedBy;
    return this.documentModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  async remove(id: string) {
    const existing = await this.documentModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    await this.documentModel.findByIdAndDelete(id).exec();
    return { message: 'Document deleted' };
  }
}