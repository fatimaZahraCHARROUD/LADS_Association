import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentPermission,
  DocumentPermissionDocument,
} from './schemas/document-permission.schema';
import { CreateDocumentPermissionDto } from './dto/create-document-permission.dto';

@Injectable()
export class DocumentPermissionsService {
  constructor(
    @InjectModel(DocumentPermission.name)
    private permissionModel: Model<DocumentPermissionDocument>,
  ) {}

  create(dto: CreateDocumentPermissionDto) {
    return this.permissionModel.create(dto);
  }

  findByDocument(documentId: string) {
    return this.permissionModel
      .find({ document: documentId })
      .populate('user', 'fullName email')
      .exec();
  }

  async remove(id: string) {
    const existing = await this.permissionModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Permission ${id} not found`);
    await this.permissionModel.findByIdAndDelete(id).exec();
    return { message: 'Permission deleted' };
  }

  async canView(
    documentId: string,
    userId: string,
    userDepartments: string[],
  ): Promise<boolean> {
    const permissions = await this.permissionModel
      .find({ document: documentId, canView: true })
      .exec();

    if (permissions.length === 0) return true; // no restriction = public

    return permissions.some((p) => {
      if (p.permissionType === 'user') {
        return p.user?.toString() === userId;
      }
      if (p.permissionType === 'department') {
        return userDepartments.includes(p.department?.toString() ?? '');
      }
      return false;
    });
  }
}
