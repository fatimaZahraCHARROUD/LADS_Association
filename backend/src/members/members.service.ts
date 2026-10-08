import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { Cellule, CelluleDocument } from '../cellules/schemas/cellule.schema';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export interface MemberFilter {
  nom?: string;
  ville?: string;
  status?: string;
  departement?: string;
}

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Cellule.name)
    private celluleModel: Model<CelluleDocument>,
  ) {}

  // ─────────────────────────────────────────────
  //  CREATE
  // ─────────────────────────────────────────────
 async create(dto: CreateMemberDto, file?: Express.Multer.File) {
  console.log('[create] role=', JSON.stringify(dto.role),
            'departement=', JSON.stringify(dto.departement));
  
  const existing = await this.userModel.findOne({ email: dto.email });
  if (existing) throw new BadRequestException('Email already exists');

  const profileImage = file ? `/uploads/members/${file.filename}` : '';
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const membershipNumber = await this.generateMembershipNumber();

  const requestedRole = (dto.role || 'Member').trim();
  const isGlobal = GLOBAL_ROLES.includes(requestedRole);

  const memberships: any[] = [];

  // 1. ALWAYS add the global membership if the requested role is global
  if (isGlobal) {
    memberships.push({
      _id: new Types.ObjectId(),
      departmentId: null,
      role: requestedRole,
    });
  }

  // 2. Add a department membership if a department was provided
  const deptId = await this.resolveDepartmentId(dto.departement);
  if (deptId) {
    memberships.push({
      _id: new Types.ObjectId(),
      departmentId: deptId,
      role: 'Member', // department default; Team Manager/Responsable come from the Departments page
    });
  }

  // 3. Never leave the user without at least one membership
  if (memberships.length === 0) {
    memberships.push({
      _id: new Types.ObjectId(),
      departmentId: null,
      role: 'Member',
    });
  }

  // 4. activeMembershipId: prefer the global one, else the department one
  const activeMembershipId =
    memberships.find((m) => !m.departmentId)?._id ?? memberships[0]._id;

  // 5. Legacy `role` array = union of membership roles
  const roleArray = Array.from(
    new Set(memberships.map((m) => m.role).filter(Boolean)),
  );

  const { role: _ignoredRole, ...rest } = dto as any;

  const member = await this.userModel.create({
    ...rest,
    password: hashedPassword,
    profileImage,
    membershipNumber,
    date_adhesion:
      dto.date_adhesion ?? new Date().toISOString().slice(0, 10),
    memberships,
    activeMembershipId,
    role: roleArray,
    departement: deptId ? [deptId] : [],
    isAdmin: requestedRole === 'President',
  });

  const obj: any = member.toObject();
  delete obj.password;
  return obj;
}

  private async generateMembershipNumber(): Promise<string> {
    const count = await this.userModel.countDocuments({
      membershipNumber: /^MEM-/,
    });
    let number = count + 1;
    let candidate = `MEM-${String(number).padStart(4, '0')}`;

    while (await this.userModel.findOne({ membershipNumber: candidate })) {
      number += 1;
      candidate = `MEM-${String(number).padStart(4, '0')}`;
    }

    return candidate;
  }

  // ─────────────────────────────────────────────
  //  READ
  // ─────────────────────────────────────────────
  async findAll(filter: MemberFilter = {}, userId?: string) {
    const query: any = { isAdmin: { $ne: true } };

    if (userId) {
      const role = await this.getActiveRole(userId);
      const globalRoles = ['President', 'Director Executive'];

      if (!globalRoles.includes(role ?? '')) {
        if (role === 'Team Manager') {
          const deptNames = await this.getTeamManagerDepartmentNames(userId);
          if (deptNames.length === 0) {
            query._id = { $in: [] };
          } else if (filter.departement) {
            if (deptNames.includes(filter.departement)) {
              query.departement = filter.departement;
            } else {
              query._id = { $in: [] };
            }
          } else {
            query.departement = { $in: deptNames };
          }
        } else if (role === 'Responsable') {
          const memberIds = await this.getResponsableMemberIds(userId);
          const oids = memberIds.map((id) => new Types.ObjectId(id));
          query._id = { $in: oids.length ? oids : [new Types.ObjectId()] };
          if (filter.departement) query.departement = filter.departement;
        } else {
          query._id = Types.ObjectId.isValid(userId)
            ? new Types.ObjectId(userId)
            : new Types.ObjectId();
        }
      }
    }

    if (filter.nom) query.fullName = { $regex: filter.nom, $options: 'i' };
    if (filter.ville) query.ville = { $regex: filter.ville, $options: 'i' };
    if (filter.status) query.status = filter.status;
    if (filter.departement && query.departement === undefined) {
      query.departement = filter.departement;
    }

    return this.userModel
      .find(query)
      .select('-password')
      .populate('memberships.departmentId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const member = await this.userModel
      .findById(id)
      .select('-password')
      .populate('memberships.departmentId', 'name')
      .exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────
async update(id: string, dto: UpdateMemberDto, file?: Express.Multer.File) {
  const memberDoc = await this.userModel.findById(id).exec();
  if (!memberDoc) throw new NotFoundException(`Member ${id} not found`);

  const { role: newRole, departement: newDept, ...rest } = dto as any;
  const data: any = { ...rest };

  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  if (file) data.profileImage = `/uploads/members/${file.filename}`;

  // Snapshot existing memberships (plain objects)
  const existing: any[] = (memberDoc.memberships ?? []).map((m: any) =>
    typeof m.toObject === 'function' ? m.toObject() : m,
  );

  // Keep the current global membership around unless the caller explicitly
  // demotes the user to a *non-global* role.
  const currentGlobal = existing.find(
    (m) => !m.departmentId && GLOBAL_ROLES.includes(m.role),
  );

  // What global role should we end up with?
  let targetGlobalRole: string | null = currentGlobal?.role ?? null;
  if (newRole !== undefined) {
    const roleTrimmed = String(newRole).trim();
    if (GLOBAL_ROLES.includes(roleTrimmed)) {
      targetGlobalRole = roleTrimmed;
    } else if (!currentGlobal) {
      // Caller sent a non-global role and the user had no global role
      // before → stay non-global (null).
      targetGlobalRole = null;
    }
    // else: caller sent a non-global role but the user IS a global role →
    // keep the existing global role (Model 2: coexist).
  }

  // Start from department memberships only
  let memberships = existing.filter((m) => !!m.departmentId);

  // Handle department change
  if (newDept !== undefined) {
    const deptId = await this.resolveDepartmentId(newDept);
    if (deptId) {
      const currentDept = existing.find((m) => !!m.departmentId);
      const preservedRole =
        currentDept &&
        ['Team Manager', 'Responsable'].includes(currentDept.role)
          ? currentDept.role
          : 'Member';
      memberships = memberships.filter(
        (m) => String(m.departmentId) !== String(deptId),
      );
      memberships.push({
        _id: new Types.ObjectId(),
        departmentId: deptId,
        role: preservedRole,
      });
    }
  }

  // Add the global membership back if we have one
  if (targetGlobalRole) {
    memberships.push({
      _id: currentGlobal?._id ?? new Types.ObjectId(),
      departmentId: null,
      role: targetGlobalRole,
    });
  }

  // Never leave the user with zero memberships
  if (memberships.length === 0) {
    memberships.push({
      _id: new Types.ObjectId(),
      departmentId: null,
      role: 'Member',
    });
  }

  // activeMembershipId
  const activeStillValid = memberships.some(
    (m) => String(m._id) === String(memberDoc.activeMembershipId),
  );
  if (!activeStillValid) {
    const globalMembership = memberships.find((m) => !m.departmentId);
    data.activeMembershipId = globalMembership?._id ?? memberships[0]._id;
  }

  // Legacy fields
  data.memberships = memberships;
  data.role = Array.from(
    new Set(memberships.map((m) => m.role).filter(Boolean)),
  );
  data.departement = memberships
    .filter((m) => !!m.departmentId)
    .map((m) => m.departmentId);
  data.isAdmin = memberships.some(
    (m) => !m.departmentId && m.role === 'President',
  );

  const member = await this.userModel
    .findByIdAndUpdate(id, data, { new: true })
    .select('-password')
    .populate('memberships.departmentId', 'name')
    .exec();
  if (!member) throw new NotFoundException(`Member ${id} not found`);
  return member;
}

  async remove(id: string) {
    const member = await this.userModel.findByIdAndDelete(id).exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return { deleted: true };
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  private async getActiveRole(userId: string): Promise<string | null> {
    const user = await this.userModel
      .findById(userId)
      .select('memberships activeMembershipId isAdmin role')
      .lean()
      .exec();
    if (!user) return null;
    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return 'President';
    }
    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    return active?.role ?? null;
  }

  private async resolveDepartmentId(
    names?: string[] | string,
  ): Promise<Types.ObjectId | null> {
    const name = Array.isArray(names) ? names[0] : (names ?? null);
    if (!name) return null;

    // Accept both _id and name
    if (Types.ObjectId.isValid(name)) {
      const exists = await this.departmentModel.exists({
        _id: new Types.ObjectId(name),
      });
      if (exists) return new Types.ObjectId(name);
    }

    const dept = await this.departmentModel
      .findOne({ name })
      .select('_id')
      .lean()
      .exec();
    return dept ? (dept._id as Types.ObjectId) : null;
  }

  private async getTeamManagerDepartmentNames(
    userId: string,
  ): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('memberships')
      .lean()
      .exec();
    const deptIds = new Set<string>();
    (user?.memberships ?? []).forEach((m: any) => {
      if (m.role === 'Team Manager' && m.departmentId) {
        deptIds.add(String(m.departmentId));
      }
    });
    const depts = await this.departmentModel
      .find({
        teamManagers: Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : userId,
      })
      .select('_id name')
      .lean()
      .exec();
    depts.forEach((d) => deptIds.add(String(d._id)));

    if (deptIds.size === 0) return [];

    const all = await this.departmentModel
      .find({ _id: { $in: [...deptIds] } })
      .select('name')
      .lean()
      .exec();
    return all.map((d) => d.name);
  }

  private async getResponsableMemberIds(userId: string): Promise<string[]> {
    const cellules = await this.celluleModel
      .find({
        managerId: Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : userId,
      })
      .select('members')
      .lean()
      .exec();
    const ids = new Set<string>();
    cellules.forEach((c: any) => {
      (c.members ?? []).forEach((m: any) => ids.add(String(m)));
    });
    return [...ids];
  }
}