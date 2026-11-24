import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Department } from '../departments/entities/department.entity';
import { FollowupNote } from '../followups/entities/followup-note.entity';
import { Meeting } from '../meetings/entities/meeting.entity';
import { Objective } from '../objectives/entities/objective.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';

export interface DashboardFilters {
  departmentId?: string;
  memberId?: string;
  from?: string;
  to?: string;
  period?: string;
}

function getCurrentWeekRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Meeting) private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(Objective) private readonly objectiveRepo: Repository<Objective>,
    @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    @InjectRepository(FollowupNote) private readonly followupRepo: Repository<FollowupNote>,
  ) {}

  async getExecutiveDashboard() {
    const [totalDepartments, totalMembers, totalProjects, objectives, projects] = await Promise.all([
      this.departmentRepo.count(),
      this.userRepo.count({ where: { isAdmin: false } }),
      this.projectRepo.count(),
      this.objectiveRepo.find({ order: { weekEnd: 'ASC' } }),
      this.projectRepo.find({ order: { endDate: 'ASC' } }),
    ]);

    return {
      overview: { totalDepartments, totalMembers, totalProjects },
      data: { objectives, projects },
    };
  }

  async getTeamManagerDashboard(userId: string) {
    const numId = Number(userId);
    const user = await this.userRepo.findOne({ where: { id: numId }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User session is invalid');

    const isGlobalAdmin = user.isAdmin === true || (user.role ?? []).includes('President');
    const memberships = user.memberships ?? [];
    const tmDeptIds = memberships.filter((m: any) => m.role === 'Team Manager' && m.departmentId).map((m: any) => Number(m.departmentId));

    let departments: Department[];
    if (isGlobalAdmin) {
      departments = [];
    } else {
      departments = await this.departmentRepo
        .createQueryBuilder('d')
        .where('d.manager = :uid OR d.vice_manager = :uid OR JSON_CONTAINS(d.team_managers, :juid)', { uid: numId, juid: JSON.stringify(numId) })
        .orWhere(tmDeptIds.length ? 'd.id IN (:...ids)' : '1=0', { ids: tmDeptIds.length ? tmDeptIds : [0] })
        .getMany();
    }

    const departmentIds = departments.map((d) => d.id);
    const [totalDepartments, totalMembers, totalProjects, activeProjects] = await Promise.all([
      isGlobalAdmin ? this.departmentRepo.count() : Promise.resolve(departmentIds.length),
      isGlobalAdmin
        ? this.userRepo.count({ where: { isAdmin: false } })
        : (departmentIds.length ? this.getMemberCountForDepts(departmentIds) : Promise.resolve(0)),
      isGlobalAdmin ? this.projectRepo.count() : (departmentIds.length ? this.projectRepo.count({ where: { departmentId: In(departmentIds) } }) : Promise.resolve(0)),
      isGlobalAdmin
        ? this.projectRepo.find({ where: { status: 'in_progress' }, order: { endDate: 'ASC' } })
        : (departmentIds.length ? this.projectRepo.find({ where: { status: 'in_progress', departmentId: In(departmentIds) }, order: { endDate: 'ASC' } }) : Promise.resolve([])),
    ]);

    return {
      overview: { totalDepartments, totalMembers, totalProjects },
      data: { activeProjects },
    };
  }

  async getResponsableDashboard(userId: string) {
    const numId = Number(userId);
    const user = await this.userRepo.findOne({ where: { id: numId }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User session is invalid');

    const { start, end } = getCurrentWeekRange();
    const memberships = user.memberships ?? [];
    const deptIds = [...new Set(
      memberships.filter((m: any) => m.role === 'Responsable' && m.departmentId).map((m: any) => Number(m.departmentId))
    )];

    const departments = deptIds.length ? await this.departmentRepo.find({ where: { id: In(deptIds) } }) : [];
    const deptMemberIds = [...new Set(departments.flatMap((d) => d.members ?? []).filter((id) => id !== numId))];

    const [totalMembers, members] = deptMemberIds.length
      ? await Promise.all([
          Promise.resolve(deptMemberIds.length),
          this.userRepo.find({ where: { id: In(deptMemberIds) }, select: { id: true, fullName: true, email: true, status: true } as any, order: { fullName: 'ASC' } }),
        ])
      : [0, []];

    const [totalPendingTasks, totalCompletedTasks, pendingTasks, objectives] = await Promise.all([
      deptIds.length ? this.taskRepo.count({ where: { departmentId: In(deptIds), status: In(['todo', 'in-progress']) } }) : Promise.resolve(0),
      deptIds.length ? this.taskRepo.count({ where: { departmentId: In(deptIds), status: 'done' } }) : Promise.resolve(0),
      deptIds.length ? this.taskRepo.find({ where: { departmentId: In(deptIds), status: In(['todo', 'in-progress']) }, order: { deadline: 'ASC' } }) : Promise.resolve([]),
      deptIds.length ? this.objectiveRepo.createQueryBuilder('o').where('o.department_id IN (:...ids)', { ids: deptIds }).andWhere('o.week_start <= :end', { end }).andWhere('o.week_end >= :start', { start }).orderBy('o.weekStart', 'ASC').getMany() : Promise.resolve([]),
    ]);

    return {
      overview: { totalMembers, totalPendingTasks, totalCompletedTasks },
      data: { objectives, members, pendingTasks },
    };
  }

  async getMemberDashboard(userId: string) {
    const numId = Number(userId);
    const user = await this.userRepo.findOne({ where: { id: numId }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User session is invalid');

    const { start, end } = getCurrentWeekRange();
    const memberships = user.memberships ?? [];
    const deptIds = [...new Set(memberships.map((m: any) => Number(m.departmentId)).filter(Boolean))];

    const [tasks, totalTasks, totalCompletedTasks] = await Promise.all([
      this.taskRepo.find({ where: { assignedTo: numId }, order: { deadline: 'ASC', createdAt: 'DESC' } }),
      this.taskRepo.count({ where: { assignedTo: numId } }),
      this.taskRepo.count({ where: { assignedTo: numId, status: 'done' } }),
    ]);

    const objectives = deptIds.length
      ? await this.objectiveRepo.createQueryBuilder('o').where('o.department_id IN (:...ids)', { ids: deptIds }).andWhere('o.week_start <= :end', { end }).andWhere('o.week_end >= :start', { start }).orderBy('o.weekStart', 'ASC').getMany()
      : [];

    const weeklyTasks = tasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return deadline !== null && deadline >= start && deadline <= end;
    });

    return {
      user: { fullName: user.fullName },
      overview: { totalTasks, totalCompletedTasks },
      data: {
        thisWeek: { tasks: weeklyTasks, objectives },
        tasks,
      },
    };
  }

  async getDashboard(userId: string, filters: DashboardFilters = {}) {
    const access = await this.resolveAccess(userId, filters.departmentId, filters.memberId);
    const departmentIds = access.allowedDepartmentIds.length ? access.allowedDepartmentIds.map(Number) : await this.getAllDepartmentIds();

    const fromDate = this.parseDate(filters.from) ?? this.startOfPeriod(filters.period ?? 'month');
    const toDate = this.parseDate(filters.to) ?? new Date();

    const departmentList = access.allowAllDepartments
      ? await this.departmentRepo.find({ order: { name: 'ASC' } })
      : (departmentIds.length ? await this.departmentRepo.find({ where: { id: In(departmentIds) }, order: { name: 'ASC' } }) : []);

    const memberIds = access.allowAllDepartments
      ? await this.getAllMemberIds()
      : (departmentIds.length ? await this.getMemberIdsForDepartments(departmentIds) : []);

    const resolvedMemberIds = filters.memberId ? [Number(filters.memberId)] : memberIds;

    const [totalProjects, tasks, meetings, activities, objectives] = await Promise.all([
      access.allowAllDepartments ? this.projectRepo.count() : (departmentIds.length ? this.projectRepo.count({ where: { departmentId: In(departmentIds) } }) : Promise.resolve(0)),
      resolvedMemberIds.length ? this.taskRepo.createQueryBuilder('t').where('t.assigned_to IN (:...mids)', { mids: resolvedMemberIds }).andWhere('t.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate }).getMany() : Promise.resolve([]),
      departmentIds.length ? this.meetingRepo.createQueryBuilder('m').where('m.department_id IN (:...ids)', { ids: departmentIds }).andWhere('m.startAt BETWEEN :from AND :to', { from: fromDate, to: toDate }).getMany() : Promise.resolve([]),
      this.activityRepo.find({ order: { createdAt: 'DESC' } }),
      departmentIds.length ? this.objectiveRepo.find({ where: { departmentId: In(departmentIds) } }) : Promise.resolve([]),
    ]);

    const notes = departmentIds.length
      ? await this.followupRepo.createQueryBuilder('n').where('n.department_id IN (:...ids)', { ids: departmentIds }).andWhere('n.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate }).orderBy('n.createdAt', 'DESC').getMany()
      : [];

    const overview = {
      totalDepartments: departmentList.length,
      totalMembers: resolvedMemberIds.length,
      totalProjects,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'done').length,
      pendingTasks: tasks.filter((t) => t.status !== 'done').length,
      overdueTasks: tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length,
      meetingsHeld: meetings.length,
      totalActivities: activities.length,
    };

    return {
      overview,
      departments: [],
      activityTrend: this.buildTrend(tasks, meetings, activities, fromDate, toDate),
      recentActivities: this.buildRecentActivities(tasks, meetings, activities),
      recentNotes: notes.slice(0, 8),
    };
  }

  async getDepartmentSummary(userId: string, departmentId: string) {
    const access = await this.resolveAccess(userId, departmentId);
    if (!access.allowAllDepartments && !access.allowedDepartmentIds.includes(departmentId)) {
      throw new ForbiddenException('You cannot access this department');
    }

    const numId = Number(departmentId);
    const department = await this.departmentRepo.findOne({ where: { id: numId } });
    if (!department) throw new NotFoundException(`Department ${departmentId} not found`);

    const memberIds = [...(department.members ?? []), ...(department.teamManagers ?? [])];
    if (department.manager) memberIds.push(department.manager);
    if (department.viceManager) memberIds.push(department.viceManager);

    const [members, tasks, meetings, objectives, notes] = await Promise.all([
      memberIds.length ? this.userRepo.find({ where: { id: In(memberIds) }, select: { id: true, fullName: true } as any }) : Promise.resolve([]),
      memberIds.length ? this.taskRepo.find({ where: { assignedTo: In(memberIds) } }) : Promise.resolve([]),
      this.meetingRepo.find({ where: { departmentId: numId } }),
      this.objectiveRepo.find({ where: { departmentId: numId } }),
      this.followupRepo.find({ where: { departmentId: numId }, order: { createdAt: 'DESC' } }),
    ]);

    return {
      department: { id: department.id, name: department.name },
      ...this.calculateDepartmentSummary({ departmentName: department.name, members, tasks, meetings, objectives, notes }),
      members,
      recentNotes: notes.slice(0, 8),
    };
  }

  async getMemberSummary(userId: string, memberId: string) {
    const numMemberId = Number(memberId);
    const access = await this.resolveAccess(userId, undefined, memberId);
    const member = await this.userRepo.findOne({ where: { id: numMemberId }, relations: ['memberships'] });
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);

    const memberDeptIds = (member.memberships ?? []).filter((m: any) => m.departmentId).map((m: any) => String(m.departmentId));
    if (!access.allowAllDepartments && !memberDeptIds.some((id) => access.allowedDepartmentIds.includes(id))) {
      throw new ForbiddenException('This member is outside your department scope');
    }

    const [tasks, meetings, notes] = await Promise.all([
      this.taskRepo.find({ where: { assignedTo: numMemberId } }),
      this.meetingRepo.createQueryBuilder('m').where(`JSON_CONTAINS(m.participants, :uid)`, { uid: JSON.stringify(numMemberId) }).getMany(),
      this.followupRepo.find({ where: { memberId: numMemberId }, order: { createdAt: 'DESC' } }),
    ]);

    return {
      member: { id: member.id, fullName: member.fullName, email: member.email, departments: memberDeptIds },
      ...this.calculateMemberSummary({ memberId, tasks, meetings, notes }),
      recentNotes: notes.slice(0, 8),
    };
  }

  calculateDepartmentSummary({ departmentName, members, tasks, meetings, objectives, notes }: { departmentName: string; members: any[]; tasks: any[]; meetings: any[]; objectives: any[]; notes: any[] }) {
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
    const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
    const currentProgress = objectives.length ? Math.round(objectives.reduce((sum, o) => sum + (Number(o.progress ?? 0) || 0), 0) / objectives.length) : 0;
    const latestFollowUp = notes.length ? notes[0] : null;

    return {
      departmentName,
      totalMembers: members.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      meetingsHeld: meetings.length,
      currentProgress,
      latestFollowUpDate: latestFollowUp ? new Date(latestFollowUp.createdAt ?? Date.now()).toISOString() : null,
      latestFollowUpNote: latestFollowUp ? (latestFollowUp.text ?? 'Recent follow-up available') : null,
    };
  }

  calculateMemberSummary({ memberId, tasks, meetings, notes }: { memberId: string; tasks: any[]; meetings: any[]; notes: any[] }) {
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
    const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
    return {
      memberId,
      totalAssignedTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      meetingsAttended: meetings.length,
      lastActivityDate: null,
      recentFollowUpCount: notes.length,
    };
  }

  private async resolveAccess(userId: string, departmentId?: string, memberId?: string) {
    const numId = Number(userId);
    const user = await this.userRepo.findOne({ where: { id: numId }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User session is invalid');
    if (user.isAdmin || (user.role ?? []).includes('President')) {
      return { allowAllDepartments: true, allowedDepartmentIds: [], role: 'President' };
    }

    const activeMembership = (user.memberships ?? []).find((m: any) => m.id === user.activeMembershipId);
    const role = activeMembership?.role ?? 'Member';
    const allowedDepartmentIds = new Set<string>((user.memberships ?? []).filter((m: any) => m.departmentId).map((m: any) => String(m.departmentId)));

    if (role === 'Director Executive') return { allowAllDepartments: true, allowedDepartmentIds: [], role };
    if (departmentId && !allowedDepartmentIds.has(String(departmentId))) throw new ForbiddenException('You do not have access to this department');

    return { allowAllDepartments: false, allowedDepartmentIds: [...allowedDepartmentIds], role };
  }

  private async getAllDepartmentIds(): Promise<number[]> {
    const depts = await this.departmentRepo.find({ select: { id: true } as any });
    return depts.map((d) => d.id);
  }

  private async getMemberIdsForDepartments(departmentIds: number[]): Promise<number[]> {
    const members = await this.userRepo.createQueryBuilder('u').where('u.isAdmin = false').getMany();
    return members.filter((u) => u.departement?.some((dId) => departmentIds.includes(dId))).map((u) => u.id);
  }

  private async getMemberCountForDepts(departmentIds: number[]): Promise<number> {
    return (await this.getMemberIdsForDepartments(departmentIds)).length;
  }

  private async getAllMemberIds(): Promise<number[]> {
    const members = await this.userRepo.find({ where: { isAdmin: false }, select: { id: true } as any });
    return members.map((u) => u.id);
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private startOfPeriod(period: string): Date {
    const now = new Date();
    if (period === 'week') {
      const diff = (now.getDay() + 6) % 7;
      const current = new Date(now);
      current.setHours(0, 0, 0, 0);
      current.setDate(current.getDate() - diff);
      return current;
    }
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    current.setHours(0, 0, 0, 0);
    return current;
  }

  private buildTrend(tasks: any[], meetings: any[], activities: any[], from: Date, to: Date) {
    const steps: any[] = [];
    const start = new Date(from);
    const totalDays = Math.max(1, Math.ceil((to.getTime() - start.getTime()) / 86400000) + 1);
    for (let i = 0; i < totalDays; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      steps.push({
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasks: tasks.filter((t) => t.createdAt?.toISOString?.().slice(0, 10) === key).length,
        meetings: meetings.filter((m) => m.startAt?.toISOString?.().slice(0, 10) === key).length,
        activities: activities.filter((a) => a.createdAt?.toISOString?.().slice(0, 10) === key).length,
      });
    }
    return steps;
  }

  private buildRecentActivities(tasks: any[], meetings: any[], activities: any[]) {
    return [
      ...tasks.map((t) => ({ type: 'task', title: t.title ?? 'Task update', detail: `Assigned`, timestamp: t.createdAt ?? new Date() })),
      ...meetings.map((m) => ({ type: 'meeting', title: m.title ?? 'Meeting', detail: 'Department meeting', timestamp: m.startAt ?? new Date() })),
      ...activities.map((a) => ({ type: 'activity', title: a.title ?? 'Activity', detail: 'Association activity', timestamp: a.createdAt ?? new Date() })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)
      .map((item) => ({ ...item, timestamp: new Date(item.timestamp).toISOString() }));
  }
}
