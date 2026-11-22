import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { ProjectCell, ProjectCellDocument } from './schemas/project-cell.schema';
import { ProjectTask, ProjectTaskDocument } from './schemas/project-task.schema';
import {
  AuthUser, isManagerOrAdmin, isParticipant, oid, projectUserIds, idOf,
} from './project-access';
import {
  CreateCellDto, CreateTaskDto, UpdateCellDto, UpdateTaskDto,
} from './dto/project-work.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

const USER_FIELDS = 'firstName lastName name fullName email'; // champs du schéma User

@Injectable()
export class ProjectWorkService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectCell.name) private cellModel: Model<ProjectCellDocument>,
    @InjectModel(ProjectTask.name) private taskModel: Model<ProjectTaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // construit l'utilisateur courant : id + droit admin (President / isAdmin)
  async getAuthUser(userId: string): Promise<AuthUser> {
    const u: any = await this.userModel
      .findById(oid(userId))
      .select('isAdmin role')
      .lean();
    if (!u) throw new ForbiddenException('Utilisateur introuvable');
    const legacy: string[] = Array.isArray(u.role) ? u.role : [u.role].filter(Boolean);
    return {
      id: String(u._id),
      isAdmin: u.isAdmin === true || legacy.includes('President'),
    };
  }

  // ---------- helpers ----------
  private async getProject(id: any): Promise<any> {
    const project = await this.projectModel.findById(oid(String(id))).lean();
    if (!project) throw new NotFoundException('Projet introuvable');
    return project;
  }

  private async getCell(id: string) {
    const cell = await this.cellModel.findById(oid(id));
    if (!cell) throw new NotFoundException('Cellule introuvable');
    return cell;
  }

  private checkProjectMembers(project: any, ids: string[] = []) {
    const allowed = projectUserIds(project);
    if (ids.some((m) => !allowed.includes(String(m)))) {
      throw new BadRequestException('Un des utilisateurs ne fait pas partie du projet');
    }
  }

  // ---------- projets de l'utilisateur ----------
  async myProjects(user: AuthUser) {
    const rawId = String(user.id);
    const isOid = isValidObjectId(rawId);
    const uid = isOid ? new Types.ObjectId(rawId) : null;

    // Chercher à la fois avec ObjectId et chaîne de caractères
    const orConditions: any[] = [
      { managerIds: rawId },
      { memberIds: rawId },
    ];
    if (uid) {
      orConditions.push({ managerIds: uid }, { memberIds: uid });
    }

    const projects = await this.projectModel
      .find({ $or: orConditions })
      .populate('managerIds', USER_FIELDS)
      .populate('memberIds', USER_FIELDS)
      .lean();

    return projects.map((p: any) => {
      const isMgr = (p.managerIds ?? []).some((m: any) => {
        const mid = String(m?._id ?? m);
        return mid === rawId;
      });
      return {
        ...p,
        myRole: isMgr ? 'manager' : 'member',
      };
    });
  }

  // ---------- cellules ----------
  async listCells(projectId: string, user: AuthUser) {
    const project = await this.getProject(projectId);
    if (!isParticipant(project, user)) throw new ForbiddenException();
    const rawId = String(projectId);
    const isOid = isValidObjectId(rawId);
    const uid = isOid ? new Types.ObjectId(rawId) : null;
    const filter: any = uid
      ? { $or: [{ project: uid }, { project: rawId }] }
      : { project: rawId };

    return this.cellModel
      .find(filter)
      .populate('members', USER_FIELDS)
      .sort({ createdAt: 1 })
      .lean();
  }

  async createCell(projectId: string, dto: CreateCellDto, user: AuthUser) {
    const project = await this.getProject(projectId);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();
    this.checkProjectMembers(project, dto.members);
    return this.cellModel.create({
      name: dto.name,
      description: dto.description ?? '',
      members: (dto.members ?? [])
        .filter(Boolean)
        .map((m) => (isValidObjectId(m) ? new Types.ObjectId(m) : m)),
      project: isValidObjectId(projectId) ? new Types.ObjectId(projectId) : projectId,
    });
  }

  async updateCell(id: string, dto: UpdateCellDto, user: AuthUser) {
    const cell = await this.getCell(id);
    const project = await this.getProject(cell.project);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();
    this.checkProjectMembers(project, dto.members);

    if (dto.name !== undefined) cell.name = dto.name;
    if (dto.description !== undefined) cell.description = dto.description;
    if (dto.members) {
      cell.members = dto.members
        .filter(Boolean)
        .map((m) => (isValidObjectId(m) ? new Types.ObjectId(m) : m)) as any;
      // un membre retiré de la cellule perd ses tâches dans cette cellule
      await this.taskModel.deleteMany({ cell: cell._id, assignedTo: { $nin: cell.members } });
    }
    return cell.save();
  }

  async removeCell(id: string, user: AuthUser) {
    const cell = await this.getCell(id);
    const project = await this.getProject(cell.project);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();
    await this.taskModel.deleteMany({ cell: cell._id });
    await cell.deleteOne();
    return { deleted: true };
  }

  // ---------- tâches ----------
  async listTasks(projectId: string, user: AuthUser) {
    const project = await this.getProject(projectId);
    if (!isParticipant(project, user)) throw new ForbiddenException();
    const rawId = String(projectId);
    const isOid = isValidObjectId(rawId);
    const uid = isOid ? new Types.ObjectId(rawId) : null;

    const projectFilter = uid
      ? [{ project: uid }, { project: rawId }]
      : [{ project: rawId }];

    const andConditions: any[] = [{ $or: projectFilter }];

    if (!isManagerOrAdmin(project, user)) {
      const uRaw = String(user.id);
      const uOid = isValidObjectId(uRaw) ? new Types.ObjectId(uRaw) : null;
      const userFilter = uOid
        ? [{ assignedTo: uOid }, { assignedTo: uRaw }]
        : [{ assignedTo: uRaw }];
      andConditions.push({ $or: userFilter });
    }

    return this.taskModel
      .find({ $and: andConditions })
      .populate('assignedTo', USER_FIELDS)
      .lean();
  }

  myTasks(user: AuthUser) {
    const rawId = String(user.id);
    const isOid = isValidObjectId(rawId);
    const uid = isOid ? new Types.ObjectId(rawId) : null;
    const userFilter = uid
      ? [{ assignedTo: uid }, { assignedTo: rawId }]
      : [{ assignedTo: rawId }];

    return this.taskModel
      .find({ $or: userFilter })
      .populate('cell', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createTask(cellId: string, dto: CreateTaskDto, user: AuthUser) {
    const cell = await this.getCell(cellId);
    const project = await this.getProject(cell.project);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();
    if (!cell.members.some((m) => idOf(m) === String(dto.assignedTo))) {
      throw new BadRequestException("Ce membre n'appartient pas à la cellule");
    }
    return this.taskModel.create({
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? 'todo',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedTo: new Types.ObjectId(dto.assignedTo),
      cell: cell._id,
      project: cell.project,
    });
  }

  async updateTask(id: string, dto: UpdateTaskDto, user: AuthUser) {
    const task = await this.taskModel.findById(oid(id));
    if (!task) throw new NotFoundException('Tâche introuvable');
    const project = await this.getProject(task.project);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();

    if (dto.assignedTo) {
      const cell = await this.getCell(String(task.cell));
      if (!cell.members.some((m) => idOf(m) === String(dto.assignedTo))) {
        throw new BadRequestException("Ce membre n'appartient pas à la cellule");
      }
      task.assignedTo = new Types.ObjectId(dto.assignedTo);
    }
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    return task.save();
  }

  // le membre assigné ne peut modifier QUE le statut
  async updateTaskStatus(id: string, status: string, user: AuthUser) {
    const task = await this.taskModel.findById(oid(id));
    if (!task) throw new NotFoundException('Tâche introuvable');
    const project = await this.getProject(task.project);
    const isAssignee = String(task.assignedTo) === user.id;
    if (!isAssignee && !isManagerOrAdmin(project, user)) throw new ForbiddenException();
    task.status = status;
    return task.save();
  }

  async removeTask(id: string, user: AuthUser) {
    const task = await this.taskModel.findById(oid(id));
    if (!task) throw new NotFoundException('Tâche introuvable');
    const project = await this.getProject(task.project);
    if (!isManagerOrAdmin(project, user)) throw new ForbiddenException();
    await task.deleteOne();
    return { deleted: true };
  }
}
