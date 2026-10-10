import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LadsDocument, LadsDocumentDocument } from './schemas/document.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(LadsDocument.name)
    private documentModel: Model<LadsDocumentDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  private validateVisibility(dto: CreateDocumentDto | UpdateDocumentDto) {
    if (dto.visibility === 'department' && !dto.visibilityDepartment) {
      throw new BadRequestException(
        'visibilityDepartment is required when visibility is "department"',
      );
    }
    if (dto.visibility === 'member' && !dto.visibilityMember) {
      throw new BadRequestException(
        'visibilityMember is required when visibility is "member"',
      );
    }
  }

  async create(dto: CreateDocumentDto, userId: string) {
    this.validateVisibility(dto);
    return this.documentModel.create({
      ...dto,
      uploadedBy: userId,
    });
  }

  async findAll(userId: string, category?: string) {
    const myDepartments = await this.departmentModel
      .find({
        $or: [
          { manager: userId },
          { viceManager: userId },
          { teamManagers: userId },
          { members: userId },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    const myDepartmentIds = myDepartments.map((d) => d._id);

    const filter: Record<string, unknown> = {
      $or: [
        { visibility: 'all' },
        { visibility: 'private', uploadedBy: userId },
        {
          visibility: 'department',
          visibilityDepartment: { $in: myDepartmentIds },
        },
        { visibility: 'member', visibilityMember: userId },
      ],
    };
    if (category) filter.category = category;

    return this.documentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName email')
      .populate('visibilityDepartment', 'name')
      .populate('visibilityMember', 'fullName email')
      .exec();
  }

  async findOne(id: string) {
    const document = await this.documentModel
      .findById(id)
      .populate('uploadedBy', 'fullName email')
      .populate('visibilityDepartment', 'name')
      .populate('visibilityMember', 'fullName email')
      .exec();
    if (!document) throw new NotFoundException(`Document ${id} not found`);
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const existing = await this.documentModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Document ${id} not found`);
    if (dto.visibility) this.validateVisibility(dto);
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

  listDepartmentOptions() {
    return this.departmentModel
      .find()
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  listMyDepartments(userId: string) {
    return this.departmentModel
      .find({
        $or: [
          { manager: userId },
          { viceManager: userId },
          { teamManagers: userId },
          { members: userId },
        ],
      })
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();
  }
}
