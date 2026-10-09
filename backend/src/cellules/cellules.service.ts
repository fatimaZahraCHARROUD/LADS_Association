import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cellule, CelluleDocument } from './schemas/cellule.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateCelluleDto } from './dto/create-cellule.dto';
import { UpdateCelluleDto } from './dto/update-cellule.dto';

const USER_FIELDS = 'fullName email profileImage role';
const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class CellulesService {
  constructor(
    @InjectModel(Cellule.name)
    private readonly celluleModel: Model<CelluleDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Resolve the caller's active department + role, from their active membership.
   * Global roles get isGlobal=true (see everything).
   */
  private async getScope(userId?: string): Promise<{
    role: string | null;
    departmentId: Types.ObjectId | null;
    isGlobal: boolean;
  }> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return { role: null, departmentId: null, isGlobal: false };
    }

    const user = await this.userModel
      .findById(userId)
      .select('activeMembershipId memberships isAdmin role')
      .lean()
      .exec();

    if (!user) return { role: null, departmentId: null, isGlobal: false };

    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return { role: 'President', departmentId: null, isGlobal: true };
    }

    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    const role = active?.role ?? null;
    const isGlobal = GLOBAL_ROLES.includes(role ?? '');
    const departmentId =
      active?.departmentId && Types.ObjectId.isValid(String(active.departmentId))
        ? new Types.ObjectId(String(active.departmentId))
        : null;

    return { role, departmentId, isGlobal };
  }

  private async getAllowedDepartmentMembers(
    departmentId: Types.ObjectId,
  ): Promise<{ allowed: Set<string>; exists: boolean }> {
    const dept = await this.departmentModel
      .findById(departmentId)
      .select('manager viceManager teamManagers members')
      .lean()
      .exec();

    if (!dept) return { allowed: new Set(), exists: false };

    const allowed = new Set<string>();
    if (dept.manager) allowed.add(String(dept.manager));
    if (dept.viceManager) allowed.add(String(dept.viceManager));
    (dept.teamManagers ?? []).forEach((u: any) => allowed.add(String(u)));
    (dept.members ?? []).forEach((u: any) => allowed.add(String(u)));
    return { allowed, exists: true };
  }

  // ───── READ ─────

  async findAll(userId?: string, _departmentId?: string) {
    const scope = await this.getScope(userId);
    const filter: Record<string, unknown> = {};

    if (scope.isGlobal) {
      // Global roles can optionally filter by departmentId via query.
      if (_departmentId) {
        filter.departmentId = this.toObjectId(_departmentId, 'department');
      }
    } else {
      // Responsable: ONLY their active membership's department.
      if (!scope.departmentId) return [];
      filter.departmentId = scope.departmentId;
    }

    return this.celluleModel
      .find(filter)
      .populate('departmentId', 'name')
      .populate('managerId', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string, userId?: string) {
    const cellule = await this.celluleModel
      .findById(this.toObjectId(id, 'cellule'))
      .populate('departmentId', 'name')
      .populate('managerId', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .exec();
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);

    await this.assertCanAccessCellule(cellule, userId);
    return cellule;
  }

  // ───── CREATE ─────

  async create(dto: CreateCelluleDto, userId?: string) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Cellule name is required');
    }
    if (!userId) throw new ForbiddenException('Missing user');

    const scope = await this.getScope(userId);

    // Department is ALWAYS the caller's active department for Responsables.
    // Global roles must send one.
    let departmentId: Types.ObjectId;
    if (scope.isGlobal) {
      if (!dto.departmentId) {
        throw new BadRequestException('departmentId is required');
      }
      departmentId = await this.validateDepartment(dto.departmentId);
    } else {
      if (!scope.departmentId) {
        throw new ForbiddenException(
          'You have no active department membership.',
        );
      }
      departmentId = scope.departmentId;
    }

    // Manager is optional in the DTO; defaults to the caller.
    // Must belong to the department.
    const requestedManager = dto.managerId || userId;
    const managerOid = this.toObjectId(requestedManager, 'manager');

    const { allowed } = await this.getAllowedDepartmentMembers(departmentId);
    allowed.add(String(userId)); // caller always allowed as manager
    if (!allowed.has(String(managerOid))) {
      throw new ForbiddenException(
        'The chosen manager is not part of this department.',
      );
    }

    const members = await this.validateMembersInDepartment(
      dto.members ?? [],
      allowed,
    );

    return this.celluleModel.create({
      name: dto.name.trim(),
      description: dto.description ?? '',
      departmentId,
      managerId: managerOid,
      members,
      status: dto.status ?? 'active',
    });
  }

  // ───── UPDATE ─────

  async update(id: string, dto: UpdateCelluleDto, userId?: string) {
    const existing = await this.celluleModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Cellule ${id} not found`);

    await this.assertCanAccessCellule(existing, userId);
    const scope = await this.getScope(userId);

    const updates: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('Cellule name is required');
      }
      updates.name = dto.name.trim();
    }
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status;

    // Only global roles can move a cellule between departments.
    if (scope.isGlobal && dto.departmentId !== undefined) {
      updates.departmentId = await this.validateDepartment(dto.departmentId);
    }

    const targetDept =
      (updates.departmentId as Types.ObjectId) ?? existing.departmentId;

    if (dto.managerId !== undefined) {
      const managerOid = this.toObjectId(dto.managerId, 'manager');
      if (!scope.isGlobal) {
        const { allowed } = await this.getAllowedDepartmentMembers(targetDept);
        if (userId) allowed.add(String(userId));
        if (!allowed.has(String(managerOid))) {
          throw new ForbiddenException(
            'The chosen manager is not part of this department.',
          );
        }
      }
      updates.managerId = managerOid;
    }

    if (dto.members !== undefined) {
      const { allowed } = await this.getAllowedDepartmentMembers(targetDept);
      if (userId) allowed.add(String(userId));
      updates.members = await this.validateMembersInDepartment(
        dto.members,
        allowed,
      );
    }

    await this.celluleModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id, userId);
  }

  // ───── DELETE ─────

  async remove(id: string, userId?: string) {
    const cellule = await this.celluleModel
      .findById(this.toObjectId(id, 'cellule'))
      .exec();
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);

    await this.assertCanAccessCellule(cellule, userId);

    await this.celluleModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  // ───── ACCESS ─────

 private async assertCanAccessCellule(
  cellule: CelluleDocument,
  userId?: string,
) {
  if (!userId) throw new ForbiddenException('Missing user');
  const scope = await this.getScope(userId);
  if (scope.isGlobal) return;

  if (!scope.departmentId) {
    throw new ForbiddenException('No active department membership.');
  }

  // Handle both raw ObjectId and populated { _id, name }
  const rawDeptId =
    (cellule.departmentId as any)?._id ?? cellule.departmentId;

  if (String(rawDeptId) !== String(scope.departmentId)) {
    throw new ForbiddenException(
      'Cellule is outside your active department.',
    );
  }
}

  // ───── VALIDATION ─────

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
    return new Types.ObjectId(id);
  }

  private async validateDepartment(id: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, 'department');
    const exists = await this.departmentModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException('Department does not exist');
    return oid;
  }

  private async validateMembersInDepartment(
    ids: string[],
    allowed: Set<string>,
  ): Promise<Types.ObjectId[]> {
    if (!Array.isArray(ids)) {
      throw new BadRequestException('members must be an array');
    }
    const oids = ids.map((id) => this.toObjectId(id, 'member'));

    const count = await this.userModel.countDocuments({ _id: { $in: oids } });
    if (count !== oids.length) {
      throw new BadRequestException('One or more members do not exist');
    }

    const outsiders = oids.map(String).filter((id) => !allowed.has(id));
    if (outsiders.length) {
      throw new BadRequestException(
        'Some members do not belong to the department.',
      );
    }

    return oids;
  }
}