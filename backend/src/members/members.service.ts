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

    let scopedRoles: Map<string, string> | null = null;

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
  const scope = await this.getResponsableScopedMembers(userId, filter.departement);

  if (scope.ids.length === 0) {
    query._id = { $in: [] };
  } else {
    query._id = { $in: scope.ids.map((id) => new Types.ObjectId(id)) };
  }

  scopedRoles = scope.roles;
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
    if (filter.departement && query.departement === undefined && !scopedRoles) {
      query.departement = filter.departement;
    }

    const rows = await this.userModel
      .find(query)
      .select('-password')
      .populate('memberships.departmentId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Attach deptRole for Responsable view
    if (scopedRoles) {
      return rows.map((r: any) => ({
        ...r,
        deptRole: scopedRoles!.get(String(r._id)) ?? 'Member',
      }));
    }

    return rows;
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

  //  private async getResponsableMemberIds(userId: string): Promise<string[]> {
  //   const oid = Types.ObjectId.isValid(userId)
  //     ? new Types.ObjectId(userId)
  //     : userId;

  //   // 1. Departments where this user is Responsable (from their memberships)
  //   const me = await this.userModel
  //     .findById(userId)
  //     .select('memberships')
  //     .lean()
  //     .exec();

  //   const deptIds = new Set<string>();
  //   (me?.memberships ?? []).forEach((m: any) => {
  //     if (m.role === 'Responsable' && m.departmentId) {
  //       deptIds.add(String(m.departmentId));
  //     }
  //   });

  //   // 2. Departments of cellules they manage + members directly in those cellules
  //   const cellules = await this.celluleModel
  //     .find({ managerId: oid })
  //     .select('departmentId members')
  //     .lean()
  //     .exec();

  //   const directMemberIds = new Set<string>();
  //   cellules.forEach((c: any) => {
  //     if (c.departmentId) deptIds.add(String(c.departmentId));
  //     (c.members ?? []).forEach((m: any) => directMemberIds.add(String(m)));
  //   });

  //   if (deptIds.size === 0 && directMemberIds.size === 0) return [];

  //   const deptObjectIds = [...deptIds].map((id) => new Types.ObjectId(id));
  //   const memberObjectIds = [...directMemberIds].map(
  //     (id) => new Types.ObjectId(id),
  //   );

  //   // 3. Members = users whose `departement` array overlaps my departments
  //   //    OR users directly listed in a cellule I manage.
  //   const or: any[] = [];
  //   if (deptObjectIds.length) {
  //     or.push({ departement: { $in: deptObjectIds } });
  //     or.push({ 'memberships.departmentId': { $in: deptObjectIds } });
  //   }
  //   if (memberObjectIds.length) {
  //     or.push({ _id: { $in: memberObjectIds } });
  //   }

  //   const members = await this.userModel
  //     .find({ $or: or, isAdmin: { $ne: true } })
  //     .select('_id')
  //     .lean()
  //     .exec();

  //   return members.map((m: any) => String(m._id));
  // }

  /**
   * A Responsable sees members of the department tied to their
   * CURRENTLY ACTIVE membership only.
   *
   * Returns:
   *   ids:   unique user ids (as strings)
   *   roles: Map<userId, 'Manager' | 'Vice Manager' | 'Team Manager' | 'Member'>
   */
  private async getResponsableScopedMembers(
    userId: string,
    filterDeptName?: string,
  ): Promise<{ ids: string[]; roles: Map<string, string> }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { ids: [], roles: new Map() };
    }
    const oid = new Types.ObjectId(userId);

    // 1. Resolve the ACTIVE membership's department
    const me = await this.userModel
      .findById(userId)
      .select('activeMembershipId memberships')
      .lean()
      .exec();

    const activeMembership = (me?.memberships ?? []).find(
      (m: any) => String(m._id) === String(me?.activeMembershipId),
    );

    if (!activeMembership || !activeMembership.departmentId) {
      return { ids: [], roles: new Map() };
    }

    const activeDeptId = new Types.ObjectId(
      String(activeMembership.departmentId),
    );

    // 2. Fetch that single department (with optional name filter for safety)
    const deptQuery: any = { _id: activeDeptId };
    if (filterDeptName) deptQuery.name = filterDeptName;

    const department = await this.departmentModel
      .findOne(deptQuery)
      .select('manager viceManager teamManagers members name')
      .lean()
      .exec();

    if (!department) {
      return { ids: [], roles: new Map() };
    }

    // 3. Build userId -> label (priority: Manager > Vice > TeamManager > Member)
    const roles = new Map<string, string>();
    const setIfAbsent = (uid: any, label: string) => {
      const key = String(uid);
      if (!roles.has(key)) roles.set(key, label);
    };

    if (department.manager) setIfAbsent(department.manager, 'Manager');
    if (department.viceManager) setIfAbsent(department.viceManager, 'Vice Manager');
    (department.teamManagers ?? []).forEach((u: any) =>
      setIfAbsent(u, 'Team Manager'),
    );
    (department.members ?? []).forEach((u: any) => setIfAbsent(u, 'Member'));

    // Don't show the Responsable themselves in the list
    roles.delete(String(oid));

    return { ids: [...roles.keys()], roles };
  }
}