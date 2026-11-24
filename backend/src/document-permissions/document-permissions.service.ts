import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentPermission } from './entities/document-permission.entity';
import { CreateDocumentPermissionDto } from './dto/create-document-permission.dto';

@Injectable()
export class DocumentPermissionsService {
  constructor(
    @InjectRepository(DocumentPermission)
    private permissionRepo: Repository<DocumentPermission>,
  ) {}

  create(dto: CreateDocumentPermissionDto) {
    const permission = this.permissionRepo.create({
      ...dto,
      document: dto.document ? Number(dto.document) : undefined,
      user: dto.user ? Number(dto.user) : undefined,
      department: dto.department ? Number(dto.department) : undefined,
    } as Partial<DocumentPermission>);
    return this.permissionRepo.save(permission);
  }

  findByDocument(documentId: string) {
    return this.permissionRepo.find({ where: { document: Number(documentId) } });
  }

  async remove(id: string) {
    const existing = await this.permissionRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Permission ${id} not found`);
    await this.permissionRepo.remove(existing);
    return { message: 'Permission deleted' };
  }

  async canView(documentId: string, userId: string, userDepartments: string[]): Promise<boolean> {
    const permissions = await this.permissionRepo.find({
      where: { document: Number(documentId), canView: true },
    });

    if (permissions.length === 0) return true;

    return permissions.some((p) => {
      if (p.permissionType === 'user') return String(p.user) === userId;
      if (p.permissionType === 'department') return userDepartments.includes(String(p.department));
      return false;
    });
  }
}
