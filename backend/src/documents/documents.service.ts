import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LadsDocument, LadsDocumentDocument } from './schemas/document.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(LadsDocument.name)
    private documentModel: Model<LadsDocumentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private async getUserDepartments(userId: string): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('departement')
      .lean()
      .exec();
    return user?.departement ?? [];
  }

  async create(dto: CreateDocumentDto, userId: string) {
    const [department] = await this.getUserDepartments(userId);
    if (!department) {
      throw new BadRequestException(
        'Your account is not assigned to any department',
      );
    }
    return this.documentModel.create({
      ...dto,
      department,
      uploadedBy: userId,
    });
  }

  async findAll(userId: string, department?: string, category?: string) {
    const departments = await this.getUserDepartments(userId);
    const filter: Record<string, unknown> = {
      $or: [
        { visibility: { $ne: 'private' } },
        { department: { $in: departments } },
      ],
    };
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
    const safe: Record<string, unknown> = { ...dto };
    delete safe.department;
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
