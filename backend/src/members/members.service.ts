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

  async create(dto: CreateMemberDto, file?: Express.Multer.File) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('Email already exists');

    const profileImage = file ? `/uploads/members/${file.filename}` : '';
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const membershipNumber = await this.generateMembershipNumber();

    const role = dto.role || 'Member';
    const isGlobal = GLOBAL_ROLES.includes(role);

    // La membership contient l'_id du département (pas son nom).
    // On transforme le nom fourni (dto.departement) en _id si possible.
    const membershipDeptId = isGlobal
      ? null
      : await this.resolveDepartmentId(dto.departement);

    const memberships = [
      {
        _id: new Types.ObjectId(),
        departmentId: membershipDeptId,
        role,
      },
    ];

    // Remove `role` from spread so it doesn't overwrite the array field
    const { role: _ignoredRole, ...rest } = dto as any;

    const member = await this.userModel.create({
      ...rest,
      password: hashedPassword,
      profileImage,
      membershipNumber,
      date_adhesion:
        dto.date_adhesion ?? new Date().toISOString().slice(0, 10),
      memberships,
      activeMembershipId: memberships[0]._id,
      // keep legacy fields in sync
      role: [role],
      departement: isGlobal ? [] : (dto.departement || []),
      isAdmin: role === 'President',
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

  async findAll(filter: MemberFilter = {}, userId?: string) {
    const query: any = { isAdmin: { $ne: true } };

    // ── Étape 2 : restriction par rôle ──────────────────────────
    // Chaque rôle ne voit que ce qu'il a le droit de voir.
    if (userId) {
      const role = await this.getActiveRole(userId);
      const globalRoles = ['President', 'Director Executive'];

      // President / Exec Dir : voit TOUS les membres (aucune restriction)
      // Team Manager : uniquement les membres de SES départements
      // Responsable : uniquement les membres de SES cellules
      // Member : se voit lui-même uniquement
      if (!globalRoles.includes(role ?? '')) {
        if (role === 'Team Manager') {
          const deptNames = await this.getTeamManagerDepartmentNames(userId);
          if (deptNames.length === 0) {
            query._id = { $in: [] }; // aucun département assigné => rien
          } else if (filter.departement) {
            if (deptNames.includes(filter.departement)) {
              query.departement = filter.departement;
            } else {
              query._id = { $in: [] }; // filtre demandé hors de ses départements
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
          // simple Member : il ne voit que son propre profil
          query._id = Types.ObjectId.isValid(userId)
            ? new Types.ObjectId(userId)
            : new Types.ObjectId();
        }
      }
    }
    // ────────────────────────────────────────────────────────────

    if (filter.nom) {
      query.fullName = { $regex: filter.nom, $options: 'i' };
    }
    if (filter.ville) {
      query.ville = { $regex: filter.ville, $options: 'i' };
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.departement && query.departement === undefined) {
      query.departement = filter.departement;
    }

    return this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const member = await this.userModel.findById(id).select('-password').exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  async update(id: string, dto: UpdateMemberDto, file?: Express.Multer.File) {
    const memberDoc = await this.userModel.findById(id).exec();
    if (!memberDoc) throw new NotFoundException(`Member ${id} not found`);

    // Strip `role` from the payload — we never want to write it directly
    const { role: newRole, ...rest } = dto as any;
    const data: any = { ...rest };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    if (file) {
      data.profileImage = `/uploads/members/${file.filename}`;
    }

    // If a role was sent, rebuild memberships
    if (newRole) {
      const isGlobal = GLOBAL_ROLES.includes(newRole);
      const membershipDeptId = isGlobal
        ? null
        : await this.resolveDepartmentId(rest.departement);
      const memberships = [
        {
          _id: new Types.ObjectId(),
          departmentId: membershipDeptId,
          role: newRole,
        },
      ];
      data.memberships = memberships;
      data.activeMembershipId = memberships[0]._id;
      data.role = [newRole];
      data.departement = isGlobal ? [] : (rest.departement || []);
      data.isAdmin = newRole === 'President';
    }

    const member = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
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
  //  Helpers d'accès par rôle (étape 2)
  // ─────────────────────────────────────────────

  // Rôle ACTIF de l'utilisateur (même logique que ActiveRoleGuard)
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

  // Transforme un NOM de département (ex: "IT") en son _id,
  // pour le stocker proprement dans memberships.departmentId.
  private async resolveDepartmentId(
    names?: string[] | string,
  ): Promise<Types.ObjectId | null> {
    const name = Array.isArray(names) ? names[0] : (names ?? null);
    if (!name) return null;
    const dept = await this.departmentModel
      .findOne({ name })
      .select('_id')
      .lean()
      .exec();
    return dept ? (dept._id as Types.ObjectId) : null;
  }

  // Les DEPARTEMENTS d'un Team Manager = ceux où il est dans `teamManagers`
  // (assignés par le Président) + ceux dans ses memberships rôle "Team Manager".
  // On renvoie leurs NOMS (le champ `departement` d'un membre contient des noms).
  private async getTeamManagerDepartmentNames(
    userId: string,
  ): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('memberships').lean().exec();
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

  // Les MEMBRES d'un Responsable = les membres de SES cellules
  // (cellules dont il est le managerId)
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