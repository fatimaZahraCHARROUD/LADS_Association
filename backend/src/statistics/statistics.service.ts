import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Activity,
  ActivityDocument,
} from '../activities/schemas/activity.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import {
  FollowupNote,
  FollowupNoteDocument,
} from '../followups/schemas/followup-note.schema';
import { Meeting, MeetingDocument } from '../meetings/schemas/meeting.schema';
import {
  Objective,
  ObjectiveDocument,
} from '../objectives/schemas/objective.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

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

function utcDay(value: Date | string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isOverdueTask(task: {
  deadline?: Date | string | null;
  status?: string;
}, now = new Date()) {
  return (
    !!task.deadline &&
    String(task.status ?? '').toLowerCase() !== 'done' &&
    utcDay(task.deadline) < utcDay(now)
  );
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Meeting.name)
    private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(Objective.name)
    private readonly objectiveModel: Model<ObjectiveDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(FollowupNote.name)
    private readonly followupModel: Model<FollowupNoteDocument>,
  ) {}

  async getExecutiveDashboard() {
    const [
      totalDepartments,
      totalMembers,
      totalProjects,
      objectives,
      projects,
    ] = await Promise.all([
      this.departmentModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ isAdmin: { $ne: true } }).exec(),
      this.projectModel.countDocuments({}).exec(),
      this.objectiveModel
        .find({})
        .select(
          '_id title description weekStart weekEnd target achievement progress status',
        )
        .sort({ weekEnd: 1 })
        .lean()
        .exec(),
      this.projectModel
        .find({})
        .select('_id title description departmentId endDate status progress')
        .populate('departmentId', 'name')
        .sort({ endDate: 1 })
        .lean()
        .exec(),
    ]);

    return {
      overview: {
        totalDepartments: totalDepartments ?? 0,
        totalMembers: totalMembers ?? 0,
        totalProjects: totalProjects ?? 0,
      },
      data: { objectives, projects },
    };
  }

  async getTeamManagerDashboard(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Invalid user session');
    }

    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('isAdmin role memberships')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User session is invalid');

    const isGlobalAdmin =
      user.isAdmin === true || (user.role ?? []).includes('President');
    const memberships = user.memberships ?? [];
    const membershipDepartmentIds = memberships
      .filter(
        (membership) =>
          membership.role === 'Team Manager' && membership.departmentId,
      )
      .map((membership) => new Types.ObjectId(String(membership.departmentId)));

    const departments = isGlobalAdmin
      ? []
      : await this.departmentModel
          .find({
            $or: [
              { manager: userObjectId },
              { viceManager: userObjectId },
              { teamManagers: userObjectId },
              { _id: { $in: membershipDepartmentIds } },
            ],
          })
          .select('_id manager viceManager teamManagers members')
          .lean()
          .exec();

    const departmentIds = departments.map(
      (department) => new Types.ObjectId(String(department._id)),
    );
    const departmentMemberIds = departments.flatMap((department) => [
      ...(department.members ?? []),
      ...(department.teamManagers ?? []),
      ...(department.manager ? [department.manager] : []),
      ...(department.viceManager ? [department.viceManager] : []),
    ]);

    const projectScope = isGlobalAdmin
      ? {}
      : {
          $or: [
            { departmentId: { $in: departmentIds } },
            { managerIds: userObjectId },
            { memberIds: userObjectId },
          ],
        };
    const memberScope = isGlobalAdmin
      ? { isAdmin: { $ne: true } }
      : departmentIds.length
        ? {
            isAdmin: { $ne: true },
            $or: [
              { _id: { $in: departmentMemberIds } },
              {
                memberships: {
                  $elemMatch: { departmentId: { $in: departmentIds } },
                },
              },
              { departement: { $in: departmentIds } },
            ],
          }
        : { _id: { $in: [] } };

    const departmentScope = isGlobalAdmin
      ? {}
      : { _id: { $in: departmentIds } };
    const activeProjectFilter = {
      status: 'in_progress',
      ...projectScope,
    };
    const [totalDepartments, totalMembers, totalProjects, activeProjects] =
      await Promise.all([
        this.departmentModel.countDocuments(departmentScope).exec(),
        this.userModel.countDocuments(memberScope).exec(),
        this.projectModel.countDocuments(projectScope).exec(),
        this.projectModel
          .find(activeProjectFilter)
          .select('_id title description departmentId endDate status progress')
          .populate('departmentId', 'name')
          .sort({ endDate: 1 })
          .lean()
          .exec(),
      ]);

    return {
      overview: {
        totalDepartments: totalDepartments ?? 0,
        totalMembers: totalMembers ?? 0,
        totalProjects: totalProjects ?? 0,
      },
      data: { activeProjects },
    };
  }

  async getResponsableDashboard(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Invalid user session');
    }

    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('memberships')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User session is invalid');

    const { start, end } = getCurrentWeekRange();
    const departmentIds = [
      ...new Set(
        (user.memberships ?? [])
          .filter(
            (membership) =>
              membership.role === 'Responsable' && membership.departmentId,
          )
          .map((membership) => String(membership.departmentId)),
      ),
    ].map((id) => new Types.ObjectId(id));

    const departments = departmentIds.length
      ? await this.departmentModel
          .find({ _id: { $in: departmentIds } })
          .select('members')
          .lean()
          .exec()
      : [];
    const departmentMemberIds = [
      ...new Set(
        departments.flatMap((department) =>
          (department.members ?? []).map((memberId) => String(memberId)),
        ),
      ),
    ]
      .filter((memberId) => memberId !== String(userObjectId))
      .map((memberId) => new Types.ObjectId(memberId));

    const memberFilter = departmentIds.length
      ? {
          _id: { $ne: userObjectId },
          isAdmin: { $ne: true },
          $or: [
            { _id: { $in: departmentMemberIds } },
            {
              memberships: {
                $elemMatch: {
                  departmentId: { $in: departmentIds },
                  role: 'Member',
                },
              },
            },
            { departement: { $in: departmentIds }, role: 'Member' },
          ],
        }
      : { _id: { $in: [] } };
    const [totalMembers, members] = await Promise.all([
      this.userModel.countDocuments(memberFilter).exec(),
      this.userModel
        .find(memberFilter)
        .select('_id fullName email status')
        .sort({ fullName: 1 })
        .lean()
        .exec(),
    ]);
    const teamMemberIds = [
      ...new Set([
        ...departmentMemberIds.map(String),
        ...members.map((member) => String(member._id)),
      ]),
    ].map((memberId) => new Types.ObjectId(memberId));
    const taskScope = {
      $or: [
        { departmentId: { $in: departmentIds } },
        { assignedTo: { $in: teamMemberIds } },
      ],
    };

    const [totalPendingTasks, totalCompletedTasks, pendingTasks, objectives] =
      await Promise.all([
        this.taskModel
          .countDocuments({
            ...taskScope,
            status: { $in: ['todo', 'in-progress'] },
          })
          .exec(),
        this.taskModel.countDocuments({ ...taskScope, status: 'done' }).exec(),
        this.taskModel
          .find({
            ...taskScope,
            status: { $in: ['todo', 'in-progress'] },
          })
          .select(
            '_id title description priority deadline status assignedTo departmentId objectiveId',
          )
          .populate('assignedTo', 'fullName')
          .sort({ deadline: 1, createdAt: -1 })
          .lean()
          .exec(),
        departmentIds.length
          ? this.objectiveModel
              .find({
                departmentId: { $in: departmentIds },
                weekStart: { $lte: end },
                weekEnd: { $gte: start },
              })
              .select(
                '_id title description weekStart weekEnd target achievement progress status departmentId',
              )
              .sort({ weekStart: 1 })
              .lean()
              .exec()
          : Promise.resolve([]),
      ]);

    return {
      overview: {
        totalMembers: totalMembers ?? 0,
        totalPendingTasks: totalPendingTasks ?? 0,
        totalCompletedTasks: totalCompletedTasks ?? 0,
      },
      data: { objectives, members, pendingTasks },
    };
  }

  async getMemberDashboard(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Invalid user session');
    }

    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('fullName memberships departement')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User session is invalid');

    const { start, end } = getCurrentWeekRange();
    const departmentIds = [
      ...new Set([
        ...(user.memberships ?? [])
          .filter(
            (membership) =>
              membership.role === 'Member' && membership.departmentId,
          )
          .map((membership) => String(membership.departmentId)),
        ...(user.departement ?? []).map((departmentId) => String(departmentId)),
      ]),
    ].map((id) => new Types.ObjectId(id));

    const [tasks, totalTasks, totalCompletedTasks] = await Promise.all([
      this.taskModel
        .find({ assignedTo: userObjectId })
        .select(
          '_id title description priority deadline status objectiveId departmentId createdAt',
        )
        .sort({ deadline: 1, createdAt: -1 })
        .lean()
        .exec(),
      this.taskModel.countDocuments({ assignedTo: userObjectId }).exec(),
      this.taskModel
        .countDocuments({ assignedTo: userObjectId, status: 'done' })
        .exec(),
    ]);

    const taskObjectiveIds = [
      ...new Set(
        tasks
          .filter((task) => task.objectiveId)
          .map((task) => String(task.objectiveId)),
      ),
    ].map((id) => new Types.ObjectId(id));
    const objectiveScope = [
      ...(departmentIds.length
        ? [{ departmentId: { $in: departmentIds } }]
        : []),
      ...(taskObjectiveIds.length ? [{ _id: { $in: taskObjectiveIds } }] : []),
    ];
    const objectives = objectiveScope.length
      ? await this.objectiveModel
          .find({
            $or: objectiveScope,
            weekStart: { $lte: end },
            weekEnd: { $gte: start },
          })
          .select(
            '_id title description weekStart weekEnd target achievement progress status departmentId',
          )
          .sort({ weekStart: 1 })
          .lean()
          .exec()
      : [];
    const weeklyObjectiveIds = new Set(
      objectives.map((objective) => String(objective._id)),
    );
    const objectivesById = new Map(
      objectives.map((objective) => [String(objective._id), objective]),
    );
    const weeklyTasks = tasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const dueThisWeek =
        deadline !== null && deadline >= start && deadline <= end;
      const linkedToWeeklyObjective =
        task.objectiveId !== null &&
        task.objectiveId !== undefined &&
        weeklyObjectiveIds.has(String(task.objectiveId));
      return dueThisWeek || linkedToWeeklyObjective;
    });
    const withObjective = (task: (typeof tasks)[number]) => ({
      ...task,
      objectiveId: task.objectiveId
        ? (objectivesById.get(String(task.objectiveId)) ?? null)
        : null,
    });

    return {
      user: { fullName: user.fullName },
      overview: {
        totalTasks: totalTasks ?? 0,
        totalCompletedTasks: totalCompletedTasks ?? 0,
      },
      data: {
        thisWeek: {
          tasks: weeklyTasks.map(withObjective),
          objectives,
        },
        tasks: tasks.map(withObjective),
      },
    };
  }

  async getDashboard(userId: string, filters: DashboardFilters = {}) {
    const access = await this.resolveAccess(
      userId,
      filters.departmentId,
      filters.memberId,
    );

    const departmentIds = access.allowAllDepartments
      ? await this.getAllDepartmentIds()
      : access.allowedDepartmentIds;

    const fromDate =
      this.parseDate(filters.from) ??
      this.startOfPeriod(filters.period ?? 'month');
    const toDate = this.parseDate(filters.to) ?? new Date();
    if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
      toDate.setUTCHours(23, 59, 59, 999);
    }
    if (fromDate > toDate) {
      throw new BadRequestException('The from date must not be after to');
    }

    const departmentList = await this.departmentModel
      .find(
        access.allowAllDepartments
          ? {}
          : { _id: { $in: departmentIds.map((id) => new Types.ObjectId(id)) } },
      )
      .sort({ name: 1 })
      .select('_id name manager viceManager members teamManagers')
      .lean()
      .exec();

    const memberIds = filters.departmentId
      ? await this.getMemberIdsForDepartment(filters.departmentId)
      : access.allowAllDepartments
        ? await this.getAllMemberIds()
        : await this.getMemberIdsForDepartments(departmentIds);

    const resolvedMemberIds = filters.memberId ? [filters.memberId] : memberIds;
    const totalProjects = await this.projectModel
      .countDocuments(
        access.allowAllDepartments
          ? {}
          : {
              departmentId: {
                $in: departmentIds.map((id) => new Types.ObjectId(id)),
              },
            },
      )
      .exec();

    const taskFilter: Record<string, unknown> = {
      createdAt: { $gte: fromDate, $lte: toDate },
    };
    if (filters.departmentId) {
      taskFilter.departmentId = new Types.ObjectId(filters.departmentId);
    } else if (!access.allowAllDepartments) {
      taskFilter.departmentId = {
        $in: departmentIds.map((id) => new Types.ObjectId(id)),
      };
    }
    if (filters.memberId) {
      taskFilter.assignedTo = new Types.ObjectId(filters.memberId);
    }

    const departmentRecordFilter = filters.departmentId
      ? { departmentId: new Types.ObjectId(filters.departmentId) }
      : access.allowAllDepartments
        ? {}
        : {
            departmentId: {
              $in: departmentIds.map((id) => new Types.ObjectId(id)),
            },
          };

    const tasks = await this.taskModel
      .find(taskFilter)
      .populate('assignedTo', 'fullName')
      .populate('departmentId', 'name')
      .lean()
      .exec();

    const meetings = await this.meetingModel
      .find({
        ...departmentRecordFilter,
        startAt: { $gte: fromDate, $lte: toDate },
      })
      .lean()
      .exec();

    const activities = await this.activityModel
      .find({
        ...departmentRecordFilter,
        ...(filters.memberId
          ? { memberId: new Types.ObjectId(filters.memberId) }
          : {}),
        createdAt: { $gte: fromDate, $lte: toDate },
      })
      .lean()
      .exec();

    const objectives = await this.objectiveModel
      .find({
        ...departmentRecordFilter,
      })
      .lean()
      .exec();

    const notes = await this.followupModel
      .find({
        ...departmentRecordFilter,
        ...(filters.memberId
          ? { memberId: new Types.ObjectId(filters.memberId) }
          : {}),
        createdAt: { $gte: fromDate, $lte: toDate },
      })
      .sort({ createdAt: -1 })
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email')
      .lean()
      .exec();

    const departmentSummaries = [] as any[];
    for (const department of departmentList) {
      const departmentId = String(department._id);
      const departmentMemberIds = new Set([
        ...(await this.getMemberIdsForDepartment(departmentId)),
        ...(department.members ?? []).map((id: Types.ObjectId) => String(id)),
        ...(department.teamManagers ?? []).map((id: Types.ObjectId) =>
          String(id),
        ),
        ...(department.manager ? [String(department.manager)] : []),
        ...(department.viceManager ? [String(department.viceManager)] : []),
      ]);
      const relevantTasks = tasks.filter(
        (task) =>
          String((task.departmentId as any)?._id ?? task.departmentId) ===
            departmentId &&
          (!filters.memberId ||
            String((task.assignedTo as any)?._id ?? task.assignedTo) ===
              filters.memberId),
      );
      const relevantMeetings = meetings.filter(
        (meeting) => String(meeting.departmentId) === String(department._id),
      );
      const relevantObjectives = objectives.filter(
        (objective) =>
          String(objective.departmentId) === String(department._id),
      );
      const relevantNotes = notes.filter(
        (note) =>
          String((note.departmentId as any)?._id ?? note.departmentId) ===
          String(department._id),
      );

      departmentSummaries.push({
        _id: department._id,
        name: department.name,
        ...this.calculateDepartmentSummary({
          departmentName: department.name,
          members: (await this.userModel
            .find({
              _id: {
                $in: Array.from(departmentMemberIds).map(
                  (id) => new Types.ObjectId(id),
                ),
              },
            })
            .select('_id fullName')
            .lean()
            .exec()).filter(
            (member) => !filters.memberId || String(member._id) === filters.memberId,
          ),
          tasks: relevantTasks,
          meetings: relevantMeetings,
          objectives: relevantObjectives,
          notes: relevantNotes,
        }),
      });
    }

    const overview = {
      totalDepartments: departmentList.length,
      totalMembers: resolvedMemberIds.length,
      totalProjects,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(
        (task) => String(task.status).toLowerCase() === 'done',
      ).length,
      pendingTasks: tasks.filter(
        (task) => String(task.status).toLowerCase() === 'todo',
      ).length,
      inProgressTasks: tasks.filter(
        (task) => String(task.status).toLowerCase() === 'in-progress',
      ).length,
      completionRate: tasks.length
        ? Math.round(
            (tasks.filter(
              (task) => String(task.status).toLowerCase() === 'done',
            ).length /
              tasks.length) *
              100,
          )
        : 0,
      overdueTasks: tasks.filter((task) => isOverdueTask(task)).length,
      meetingsHeld: meetings.length,
      totalActivities: activities.length,
    };

    return {
      overview,
      departments: departmentSummaries,
      activityTrend: this.buildTrend(
        tasks,
        meetings,
        activities,
        fromDate,
        toDate,
      ),
      recentActivities: this.buildRecentActivities(tasks, meetings, activities),
      recentNotes: notes.slice(0, 8),
    };
  }

  async getDepartmentSummary(userId: string, departmentId: string) {
    if (!Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException('Invalid department ID');
    }
    const access = await this.resolveAccess(userId, departmentId);
    if (
      !access.allowAllDepartments &&
      !access.allowedDepartmentIds.includes(departmentId)
    ) {
      throw new ForbiddenException('You cannot access this department');
    }

    const department = await this.departmentModel
      .findById(departmentId)
      .select('_id name manager viceManager teamManagers members')
      .lean()
      .exec();
    if (!department)
      throw new NotFoundException(`Department ${departmentId} not found`);

    const membershipUsers = await this.userModel
      .find({
        memberships: {
          $elemMatch: { departmentId: new Types.ObjectId(departmentId) },
        },
      })
      .select('_id fullName memberships')
      .lean()
      .exec();
    const memberIds = new Set([
      ...membershipUsers.map((member) => String(member._id)),
      ...(department.members ?? []).map((id) => String(id)),
      ...(department.teamManagers ?? []).map((id) => String(id)),
      ...(department.manager ? [String(department.manager)] : []),
      ...(department.viceManager ? [String(department.viceManager)] : []),
    ]);
    const members = await this.userModel
      .find({ _id: { $in: Array.from(memberIds).map((id) => new Types.ObjectId(id)) } })
      .select('_id fullName memberships')
      .lean()
      .exec();
    const tasks = await this.taskModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .lean()
      .exec();
    const meetings = await this.meetingModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .lean()
      .exec();
    const objectives = await this.objectiveModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .lean()
      .exec();
    const notes = await this.followupModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .sort({ createdAt: -1 })
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email')
      .lean()
      .exec();

    return {
      department: { _id: department._id, name: department.name },
      ...this.calculateDepartmentSummary({
        departmentName: department.name,
        members,
        tasks,
        meetings,
        objectives,
        notes,
      }),
      members,
      recentNotes: notes.slice(0, 8),
    };
  }

  async getMemberSummary(userId: string, memberId: string) {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Invalid member ID');
    }
    const access = await this.resolveAccess(userId, undefined, memberId);
    const member = await this.userModel
      .findById(memberId)
      .select('_id fullName email memberships departement')
      .lean()
      .exec();
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);

    const memberDepartmentIds = (member.memberships ?? [])
      .filter((m) => m.departmentId)
      .map((m) => String(m.departmentId));
    (member.departement ?? []).forEach((id) =>
      memberDepartmentIds.push(String(id)),
    );
    const departmentAssignments = await this.departmentModel
      .find({
        $or: [
          { manager: new Types.ObjectId(memberId) },
          { viceManager: new Types.ObjectId(memberId) },
          { teamManagers: new Types.ObjectId(memberId) },
          { members: new Types.ObjectId(memberId) },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    const uniqueMemberDepartmentIds = [...new Set([
      ...memberDepartmentIds,
      ...departmentAssignments.map((department) => String(department._id)),
    ])];

    if (
      !access.allowAllDepartments &&
      !uniqueMemberDepartmentIds.some((id) =>
        access.allowedDepartmentIds.includes(id),
      )
    ) {
      throw new ForbiddenException(
        'This member is outside your department scope',
      );
    }

    const visibleDepartmentIds = access.allowAllDepartments
      ? uniqueMemberDepartmentIds
      : uniqueMemberDepartmentIds.filter((id) =>
          access.allowedDepartmentIds.includes(id),
        );
    const memberTaskFilter: Record<string, unknown> = {
      assignedTo: new Types.ObjectId(memberId),
    };
    if (!access.allowAllDepartments) {
      memberTaskFilter.departmentId = {
        $in: visibleDepartmentIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const tasks = await this.taskModel
      .find(memberTaskFilter)
      .populate('departmentId', 'name')
      .lean()
      .exec();
    const meetings = await this.meetingModel
      .find({
        participants: new Types.ObjectId(memberId),
        ...(!access.allowAllDepartments
          ? {
              departmentId: {
                $in: visibleDepartmentIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
      })
      .populate('departmentId', 'name')
      .lean()
      .exec();
    const notes = await this.followupModel
      .find({
        memberId: new Types.ObjectId(memberId),
        ...(!access.allowAllDepartments
          ? {
              departmentId: {
                $in: visibleDepartmentIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
      })
      .sort({ createdAt: -1 })
      .populate('departmentId', 'name')
      .populate('memberId', 'fullName')
      .populate('author', 'fullName email')
      .lean()
      .exec();

    return {
      member: {
        _id: member._id,
        fullName: member.fullName,
        email: member.email,
        departments: visibleDepartmentIds,
      },
      ...this.calculateMemberSummary({
        memberId,
        tasks,
        meetings,
        notes,
      }),
      recentNotes: notes.slice(0, 8),
    };
  }

  calculateDepartmentSummary({
    departmentName,
    members,
    tasks,
    meetings,
    objectives,
    notes,
  }: {
    departmentName: string;
    members: any[];
    tasks: any[];
    meetings: any[];
    objectives: any[];
    notes: any[];
  }) {
    const totalMembers = members.length ?? 0;
    const totalTasks = tasks.length ?? 0;
    const completedTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'done',
    ).length;
    const pendingTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'todo',
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'in-progress',
    ).length;
    const overdueTasks = tasks.filter((task) => isOverdueTask(task)).length;
    const meetingsHeld = meetings.length ?? 0;
    const currentProgress = objectives.length
      ? Math.round(
          objectives.reduce(
            (sum, objective) => sum + (Number(objective.progress ?? 0) || 0),
            0,
          ) / objectives.length,
        )
      : 0;
    const latestFollowUp = notes.length
      ? [...notes].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        )[0]
      : null;

    return {
      departmentName,
      totalMembers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
      meetingsHeld,
      currentProgress,
      latestFollowUpDate: latestFollowUp
        ? new Date(latestFollowUp.createdAt ?? Date.now()).toISOString()
        : null,
      latestFollowUpNote: latestFollowUp
        ? (latestFollowUp.text ?? 'Recent follow-up available')
        : null,
    };
  }

  calculateMemberSummary({
    memberId,
    tasks,
    meetings,
    notes,
  }: {
    memberId: string;
    tasks: any[];
    meetings: any[];
    notes: any[];
  }) {
    const completedTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'done',
    ).length;
    const pendingTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'todo',
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => String(task.status ?? '').toLowerCase() === 'in-progress',
    ).length;
    const overdueTasks = tasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return (
        !!deadline &&
        deadline.getTime() < Date.now() &&
        String(task.status ?? '').toLowerCase() !== 'done'
      );
    }).length;
    const completedWithDeadline = tasks.filter(
      (task) =>
        String(task.status ?? '').toLowerCase() === 'done' &&
        task.deadline &&
        task.completedAt,
    );
    const completedBeforeDeadline = completedWithDeadline.filter(
      (task) => utcDay(task.completedAt) < utcDay(task.deadline),
    ).length;
    const completedOnDeadline = completedWithDeadline.filter(
      (task) => utcDay(task.completedAt) === utcDay(task.deadline),
    ).length;
    const completedLate = completedWithDeadline.filter(
      (task) => utcDay(task.completedAt) > utcDay(task.deadline),
    ).length;
    const completedOnTime = completedBeforeDeadline + completedOnDeadline;

    const activityDates = [
      ...tasks.map((task) => new Date(task.deadline ?? Date.now()).getTime()),
      ...meetings.map((meeting) =>
        new Date(meeting.startAt ?? Date.now()).getTime(),
      ),
      ...notes.map((note) => new Date(note.createdAt ?? Date.now()).getTime()),
    ].filter((value) => Number.isFinite(value));

    return {
      memberId,
      totalAssignedTasks: tasks.length,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0,
      completedOnTime,
      completedBeforeDeadline,
      completedOnDeadline,
      completedLate,
      onTimeCompletionRate: completedWithDeadline.length
        ? Math.round((completedOnTime / completedWithDeadline.length) * 100)
        : 0,
      meetingsAttended: meetings.length,
      lastActivityDate: activityDates.length
        ? new Date(Math.max(...activityDates)).toISOString()
        : null,
      recentFollowUpCount: notes.length,
    };
  }

  private async resolveAccess(
    userId: string,
    departmentId?: string,
    memberId?: string,
  ) {
    if (departmentId && !Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException('Invalid department ID');
    }
    if (memberId && !Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Invalid member ID');
    }

    const user = await this.userModel
      .findById(userId)
      .select('isAdmin role memberships activeMembershipId')
      .lean()
      .exec();

    if (!user) throw new ForbiddenException('User session is invalid');
    const activeMembership = (user.memberships ?? []).find(
      (membership: any) =>
        String(membership._id) === String(user.activeMembershipId),
    );
    const role = activeMembership?.role ?? 'Member';
    const allowAllDepartments =
      user.isAdmin === true ||
      (user.role ?? []).includes('President') ||
      role === 'Director Executive';

    let memberDepartmentIds: string[] | null = null;
    if (memberId) {
      const member = await this.userModel
        .findById(memberId)
        .select('memberships departement')
        .lean()
        .exec();
      if (!member) throw new NotFoundException(`Member ${memberId} not found`);
      memberDepartmentIds = await this.getDepartmentIdsForMember(memberId, member);
      if (
        departmentId &&
        !memberDepartmentIds.includes(String(departmentId))
      ) {
        throw new BadRequestException(
          'The member does not belong to the selected department',
        );
      }
    }

    if (allowAllDepartments) {
      return {
        allowAllDepartments: true,
        allowedDepartmentIds: [],
        role: user.isAdmin || (user.role ?? []).includes('President')
          ? 'President'
          : role,
      };
    }

    const allowedDepartmentIds = new Set<string>();
    for (const membership of user.memberships ?? []) {
      if (
        membership.departmentId &&
        ['Team Manager', 'Responsable'].includes(membership.role)
      ) {
        allowedDepartmentIds.add(String(membership.departmentId));
      }
    }

    const assignedDepartments = await this.departmentModel
      .find({
        $or: [
          { manager: new Types.ObjectId(userId) },
          { viceManager: new Types.ObjectId(userId) },
          { teamManagers: new Types.ObjectId(userId) },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    assignedDepartments.forEach((department) =>
      allowedDepartmentIds.add(String(department._id)),
    );

    if (departmentId && !allowedDepartmentIds.has(String(departmentId))) {
      throw new ForbiddenException('You do not have access to this department');
    }

    if (memberDepartmentIds) {
      const isAllowed = memberDepartmentIds.some((id) =>
        allowedDepartmentIds.has(id),
      );
      if (!isAllowed) {
        throw new ForbiddenException(
          'This member is outside your allowed department scope',
        );
      }
    }

    return {
      allowAllDepartments: false,
      allowedDepartmentIds: [...allowedDepartmentIds],
      role,
    };
  }

  private async getDepartmentIdsForMember(memberId: string, member?: any) {
    const result = new Set<string>(
      (member?.memberships ?? [])
        .filter((membership: any) => membership.departmentId)
        .map((membership: any) => String(membership.departmentId)),
    );
    (member?.departement ?? []).forEach((departmentId: Types.ObjectId) =>
      result.add(String(departmentId)),
    );

    const assignedDepartments = await this.departmentModel
      .find({
        $or: [
          { manager: new Types.ObjectId(memberId) },
          { viceManager: new Types.ObjectId(memberId) },
          { teamManagers: new Types.ObjectId(memberId) },
          { members: new Types.ObjectId(memberId) },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    assignedDepartments.forEach((department) =>
      result.add(String(department._id)),
    );
    return [...result];
  }

  private async getAllDepartmentIds() {
    const departments = await this.departmentModel
      .find()
      .select('_id')
      .lean()
      .exec();
    return departments.map((department) => String(department._id));
  }

  private async getMemberIdsForDepartment(departmentId: string) {
    const members = await this.userModel
      .find({
        $or: [
          {
            memberships: {
              $elemMatch: { departmentId: new Types.ObjectId(departmentId) },
            },
          },
          { departement: new Types.ObjectId(departmentId) },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    const department = await this.departmentModel
      .findById(new Types.ObjectId(departmentId))
      .select('manager viceManager teamManagers members')
      .lean()
      .exec();
    return [
      ...new Set([
        ...members.map((member) => String(member._id)),
        ...(department?.members ?? []).map((id: Types.ObjectId) => String(id)),
        ...(department?.teamManagers ?? []).map((id: Types.ObjectId) =>
          String(id),
        ),
        ...(department?.manager ? [String(department.manager)] : []),
        ...(department?.viceManager ? [String(department.viceManager)] : []),
      ]),
    ];
  }

  private async getMemberIdsForDepartments(departmentIds: string[]) {
    if (departmentIds.length === 0) return [];

    const ids = departmentIds.map((id) => new Types.ObjectId(id));
    const members = await this.userModel
      .find({
        isAdmin: { $ne: true },
        $or: [
          { memberships: { $elemMatch: { departmentId: { $in: ids } } } },
          { departement: { $in: ids } },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    const departments = await this.departmentModel
      .find({ _id: { $in: ids } })
      .select('manager viceManager teamManagers members')
      .lean()
      .exec();
    return [
      ...new Set([
        ...members.map((member) => String(member._id)),
        ...departments.flatMap((department) => [
          ...(department.members ?? []).map((id: Types.ObjectId) =>
            String(id),
          ),
          ...(department.teamManagers ?? []).map((id: Types.ObjectId) =>
            String(id),
          ),
          ...(department.manager ? [String(department.manager)] : []),
          ...(department.viceManager ? [String(department.viceManager)] : []),
        ]),
      ]),
    ];
  }

  private async getAllMemberIds() {
    const members = await this.userModel
      .find({ isAdmin: { $ne: true } })
      .select('_id')
      .lean()
      .exec();
    return members.map((member) => String(member._id));
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date filter');
    }
    return parsed;
  }

  private startOfPeriod(period: string): Date {
    const now = new Date();
    if (period === 'week') {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const current = new Date(now);
      current.setHours(0, 0, 0, 0);
      current.setDate(current.getDate() - diff);
      return current;
    }
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    current.setHours(0, 0, 0, 0);
    return current;
  }

  private buildTrend(
    tasks: any[],
    meetings: any[],
    activities: any[],
    from: Date,
    to: Date,
  ) {
    const steps: Array<{
      label: string;
      tasks: number;
      meetings: number;
      activities: number;
    }> = [];
    const start = new Date(from);
    const end = new Date(to);
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1,
    );

    for (let index = 0; index < totalDays; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      const tasksCount = tasks.filter(
        (task) =>
          task.createdAt && task.createdAt.toISOString().slice(0, 10) === key,
      ).length;
      const meetingsCount = meetings.filter(
        (meeting) =>
          meeting.startAt && meeting.startAt.toISOString().slice(0, 10) === key,
      ).length;
      const activitiesCount = activities.filter(
        (activity) =>
          activity.createdAt &&
          activity.createdAt.toISOString().slice(0, 10) === key,
      ).length;
      steps.push({
        label: day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        tasks: tasksCount,
        meetings: meetingsCount,
        activities: activitiesCount,
      });
    }

    return steps;
  }

  private buildRecentActivities(
    tasks: any[],
    meetings: any[],
    activities: any[],
  ) {
    return [
      ...tasks.map((task) => ({
        type: 'task',
        title: task.title ?? 'Task update',
        detail: `Assigned to ${task.assignedTo ?? 'team member'}`,
        timestamp: task.createdAt ?? new Date(),
      })),
      ...meetings.map((meeting) => ({
        type: 'meeting',
        title: meeting.title ?? 'Meeting',
        detail: meeting.departmentId
          ? `Department meeting`
          : 'Cross-functional meeting',
        timestamp: meeting.startAt ?? new Date(),
      })),
      ...activities.map((activity) => ({
        type: 'activity',
        title: activity.title?.en ?? activity.title ?? 'Activity',
        detail: activity.description?.en ?? 'Association activity',
        timestamp: activity.createdAt ?? new Date(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 8)
      .map((item) => ({
        ...item,
        timestamp:
          item.timestamp instanceof Date
            ? item.timestamp.toISOString()
            : new Date(item.timestamp).toISOString(),
      }));
  }
}
