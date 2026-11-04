import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
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
    const [globalTotals, upcomingMeetings, objectives, departments] =
      await Promise.all([
        this.getGlobalDashboardTotals(),
        this.getUpcomingMeetings(),
        this.objectiveModel
          .find({})
          .select(
            '_id title description weekStart weekEnd target achievement progress status departmentId createdAt updatedAt',
          )
          .populate('departmentId', 'name')
          .sort({ weekEnd: 1 })
          .lean()
          .exec(),
        this.getExecutiveDepartments(),
      ]);
    return {
      overview: globalTotals,
      data: {
        objectives,
        departments,
        upcomingMeetings,
      },
    };
  }

  private async getGlobalDashboardTotals() {
    const [
      totalDepartments,
      totalProjects,
      totalUpcomingMeetings,
      totalMembers,
    ] = await Promise.all([
      this.departmentModel.countDocuments({}).exec(),
      this.projectModel.countDocuments({}).exec(),
      this.meetingModel.countDocuments(this.upcomingMeetingsFilter()).exec(),
      this.countDepartmentMembers(),
    ]);

    return {
      totalDepartments: totalDepartments ?? 0,
      totalMembers,
      totalProjects: totalProjects ?? 0,
      totalUpcomingMeetings: totalUpcomingMeetings ?? 0,
    };
  }

  private async getExecutiveDepartments() {
    const [departmentRecords, projectCounts, memberCounts] = await Promise.all([
      this.departmentModel
        .find({})
        .select('_id name manager')
        .sort({ name: 1 })
        .lean()
        .exec(),
      this.projectModel
        .aggregate<{
          _id: Types.ObjectId;
          count: number;
        }>([
          { $match: { departmentId: { $ne: null } } },
          { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        ])
        .exec(),
      this.getDepartmentMemberCounts(),
    ]);
    const managerIds = departmentRecords
      .map((department) => department.manager)
      .filter((managerId): managerId is Types.ObjectId => managerId != null);
    const managers = managerIds.length
      ? await this.userModel
          .find({ _id: { $in: managerIds } })
          .select('_id fullName')
          .lean()
          .exec()
      : [];
    const managerNames = new Map(
      managers.map((manager) => [String(manager._id), manager.fullName]),
    );
    const projectCountByDepartment = new Map(
      projectCounts.map((item) => [String(item._id), item.count]),
    );
    const memberCountByDepartment = new Map(
      memberCounts.map((item) => [String(item._id), item.count]),
    );

    return departmentRecords.map((department) => ({
      _id: department._id,
      name: department.name,
      membersCount: memberCountByDepartment.get(String(department._id)) ?? 0,
      projectsCount: projectCountByDepartment.get(String(department._id)) ?? 0,
      manager: department.manager
        ? (managerNames.get(String(department.manager)) ?? null)
        : null,
    }));
  }

  private activeDepartmentMemberPipeline(
    departmentIds?: Types.ObjectId[],
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [
      { $match: { isAdmin: { $ne: true }, status: 'active' } },
      { $unwind: '$memberships' },
      { $match: { 'memberships.departmentId': { $ne: null } } },
    ];
    if (departmentIds) {
      pipeline.push({
        $match: { 'memberships.departmentId': { $in: departmentIds } },
      });
    }
    return pipeline;
  }

  private getDepartmentMemberCounts() {
    return this.userModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        ...this.activeDepartmentMemberPipeline(),
        {
          $group: {
            _id: {
              departmentId: '$memberships.departmentId',
              userId: '$_id',
            },
          },
        },
        {
          $group: {
            _id: '$_id.departmentId',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
  }

  private async countDepartmentMembers(departmentIds?: Types.ObjectId[]) {
    const [result] = await this.userModel
      .aggregate<{
        count: number;
      }>([
        ...this.activeDepartmentMemberPipeline(departmentIds),
        { $group: { _id: '$_id' } },
        { $count: 'count' },
      ])
      .exec();
    return result?.count ?? 0;
  }

  private getUpcomingMeetings(
    userId?: string,
    departmentIds: Types.ObjectId[] = [],
  ) {
    return this.meetingModel
      .find(this.upcomingMeetingsFilter(userId, departmentIds))
      .select(
        '_id title description department departmentId startAt endAt status meetingLink',
      )
      .populate('departmentId', 'name')
      .populate('department', 'name')
      .sort({ startAt: 1 })
      .limit(5)
      .lean()
      .exec();
  }

  private upcomingMeetingsFilter(
    userId?: string,
    departmentIds: Types.ObjectId[] = [],
  ) {
    const scope =
      userId || departmentIds.length
        ? {
            $or: [
              ...(departmentIds.length
                ? [
                    { departmentId: { $in: departmentIds } },
                    { department: { $in: departmentIds } },
                  ]
                : []),
              ...(userId ? [{ participants: new Types.ObjectId(userId) }] : []),
            ],
          }
        : {};
    return {
      startAt: { $gte: new Date() },
      status: { $ne: 'cancelled' },
      ...scope,
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
          .select('_id')
          .lean()
          .exec();

    const departmentIds = departments.map(
      (department) => new Types.ObjectId(String(department._id)),
    );
    const projectScope = isGlobalAdmin
      ? {}
      : {
          $or: [
            { departmentId: { $in: departmentIds } },
            { managerIds: userObjectId },
            { memberIds: userObjectId },
          ],
        };
    const departmentScope = isGlobalAdmin
      ? {}
      : { _id: { $in: departmentIds } };
    const departmentProjectScope = isGlobalAdmin
      ? {}
      : { departmentId: { $in: departmentIds } };
    const activeProjectFilter = {
      status: 'in_progress',
      ...projectScope,
    };
    const [
      totalDepartments,
      totalMembers,
      totalProjects,
      activeProjects,
      upcomingMeetings,
      totalUpcomingMeetings,
    ] = await Promise.all([
      this.departmentModel.countDocuments(departmentScope).exec(),
      this.countDepartmentMembers(isGlobalAdmin ? undefined : departmentIds),
      this.projectModel.countDocuments(departmentProjectScope).exec(),
      this.projectModel
        .find(activeProjectFilter)
        .select('_id title description departmentId endDate status progress')
        .populate('departmentId', 'name')
        .sort({ endDate: 1 })
        .lean()
        .exec(),
      this.getUpcomingMeetings(undefined, departmentIds),
      this.meetingModel
        .countDocuments(this.upcomingMeetingsFilter(undefined, departmentIds))
        .exec(),
    ]);
    const taskScope = isGlobalAdmin
      ? {}
      : departmentIds.length
        ? { departmentId: { $in: departmentIds } }
        : { _id: { $in: [] } };
    const pendingTaskFilter = {
      ...taskScope,
      status: { $ne: 'done' },
    };
    const [totalPendingTasks, pendingTasks] = await Promise.all([
      this.taskModel.countDocuments(pendingTaskFilter).exec(),
      this.taskModel
        .find(pendingTaskFilter)
        .select(
          '_id title description priority deadline status assignedTo departmentId',
        )
        .populate('assignedTo', 'fullName')
        .populate('departmentId', 'name')
        .sort({ deadline: 1, createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    return {
      overview: {
        totalDepartments: totalDepartments ?? 0,
        totalMembers: totalMembers ?? 0,
        totalProjects: totalProjects ?? 0,
        totalPendingTasks: totalPendingTasks ?? 0,
        totalUpcomingMeetings: totalUpcomingMeetings ?? 0,
      },
      data: { activeProjects, pendingTasks, upcomingMeetings },
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

    const [
      totalPendingTasks,
      totalCompletedTasks,
      pendingTasks,
      objectives,
      upcomingMeetings,
      totalUpcomingMeetings,
    ] = await Promise.all([
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
        .populate('departmentId', 'name')
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
            .populate('departmentId', 'name')
            .sort({ weekStart: 1 })
            .lean()
            .exec()
        : Promise.resolve([]),
      this.getUpcomingMeetings(userId, departmentIds),
      this.meetingModel
        .countDocuments(this.upcomingMeetingsFilter(userId, departmentIds))
        .exec(),
    ]);

    return {
      overview: {
        totalMembers: totalMembers ?? 0,
        totalPendingTasks: totalPendingTasks ?? 0,
        totalCompletedTasks: totalCompletedTasks ?? 0,
        totalUpcomingMeetings: totalUpcomingMeetings ?? 0,
      },
      data: { objectives, members, pendingTasks, upcomingMeetings },
    };
  }

  async getMemberDashboard(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Invalid user session');
    }

    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('fullName email date_adhesion memberships departement')
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

    const [tasks, totalTasks, totalCompletedTasks, departments] =
      await Promise.all([
        this.taskModel
          .find({ assignedTo: userObjectId })
          .select(
            '_id title description priority deadline status objectiveId departmentId createdAt',
          )
          .populate('departmentId', 'name')
          .sort({ deadline: 1, createdAt: -1 })
          .lean()
          .exec(),
        this.taskModel.countDocuments({ assignedTo: userObjectId }).exec(),
        this.taskModel
          .countDocuments({ assignedTo: userObjectId, status: 'done' })
          .exec(),
        this.departmentModel
          .find({ _id: { $in: departmentIds } })
          .select('_id name')
          .sort({ name: 1 })
          .lean()
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
          .populate('departmentId', 'name')
          .sort({ weekStart: 1 })
          .lean()
          .exec()
      : [];
    const [upcomingMeetings, totalUpcomingMeetings] = await Promise.all([
      this.getUpcomingMeetings(userId, departmentIds),
      this.meetingModel
        .countDocuments(this.upcomingMeetingsFilter(userId, departmentIds))
        .exec(),
    ]);
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
      user: {
        fullName: user.fullName,
        email: user.email,
        dateAdhesion: user.date_adhesion,
      },
      overview: {
        totalTasks: totalTasks ?? 0,
        totalCompletedTasks: totalCompletedTasks ?? 0,
        totalPendingTasks: Math.max(
          0,
          (totalTasks ?? 0) - (totalCompletedTasks ?? 0),
        ),
        totalUpcomingMeetings: totalUpcomingMeetings ?? 0,
      },
      data: {
        thisWeek: {
          tasks: weeklyTasks.map(withObjective),
          objectives,
        },
        tasks: tasks.map(withObjective),
        departments,
        upcomingMeetings,
      },
    };
  }

  async getDashboard(userId: string, filters: DashboardFilters = {}) {
    const access = await this.resolveAccess(
      userId,
      filters.departmentId,
      filters.memberId,
    );

    const departmentIds = access.allowedDepartmentIds.length
      ? access.allowedDepartmentIds
      : await this.getAllDepartmentIds();

    const fromDate =
      this.parseDate(filters.from) ??
      this.startOfPeriod(filters.period ?? 'month');
    const toDate = this.parseDate(filters.to) ?? new Date();

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

    const memberIds = access.allowAllDepartments
      ? await this.getAllMemberIds()
      : await this.getMemberIdsForDepartments(departmentIds);

    const resolvedMemberIds = filters.memberId ? [filters.memberId] : memberIds;
    const globalTotals =
      access.allowAllDepartments && !filters.departmentId && !filters.memberId
        ? await this.getGlobalDashboardTotals()
        : null;
    const totalProjects =
      globalTotals?.totalProjects ??
      (await this.projectModel
        .countDocuments(
          access.allowAllDepartments
            ? {}
            : {
                departmentId: {
                  $in: departmentIds.map((id) => new Types.ObjectId(id)),
                },
              },
        )
        .exec());

    const tasks = await this.taskModel
      .find({
        ...(resolvedMemberIds.length
          ? {
              assignedTo: {
                $in: resolvedMemberIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
      })
      .lean()
      .exec();

    const meetings = await this.meetingModel
      .find({
        ...(departmentIds.length
          ? {
              departmentId: {
                $in: departmentIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
        ...(fromDate ? { startAt: { $gte: fromDate, $lte: toDate } } : {}),
      })
      .lean()
      .exec();

    const activities = await this.activityModel
      .find({
        ...(filters.departmentId
          ? { departmentId: new Types.ObjectId(filters.departmentId) }
          : {}),
        ...(filters.memberId
          ? { memberId: new Types.ObjectId(filters.memberId) }
          : {}),
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
      })
      .lean()
      .exec();

    const objectives = await this.objectiveModel
      .find({
        ...(departmentIds.length
          ? {
              departmentId: {
                $in: departmentIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
      })
      .lean()
      .exec();

    const notes = await this.followupModel
      .find({
        ...(departmentIds.length
          ? {
              departmentId: {
                $in: departmentIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
        ...(filters.memberId
          ? { memberId: new Types.ObjectId(filters.memberId) }
          : {}),
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const departmentSummaries = [] as any[];
    for (const department of departmentList) {
      const departmentMemberIds = await this.getMemberIdsForDepartment(
        String(department._id),
      );
      const relevantTasks = tasks.filter((task) =>
        departmentMemberIds.some(
          (memberId) => String(task.assignedTo) === String(memberId),
        ),
      );
      const relevantMeetings = meetings.filter(
        (meeting) => String(meeting.departmentId) === String(department._id),
      );
      const relevantObjectives = objectives.filter(
        (objective) =>
          String(objective.departmentId) === String(department._id),
      );
      const relevantNotes = notes.filter(
        (note) => String(note.departmentId) === String(department._id),
      );

      departmentSummaries.push({
        _id: department._id,
        name: department.name,
        ...this.calculateDepartmentSummary({
          departmentName: department.name,
          members: await this.userModel
            .find({
              _id: {
                $in: departmentMemberIds.map((id) => new Types.ObjectId(id)),
              },
            })
            .select('_id fullName')
            .lean()
            .exec(),
          tasks: relevantTasks,
          meetings: relevantMeetings,
          objectives: relevantObjectives,
          notes: relevantNotes,
        }),
      });
    }

    const overview = {
      totalDepartments: globalTotals?.totalDepartments ?? departmentList.length,
      totalMembers: globalTotals?.totalMembers ?? resolvedMemberIds.length,
      totalProjects: globalTotals?.totalProjects ?? totalProjects,
      totalUpcomingMeetings:
        globalTotals?.totalUpcomingMeetings ??
        (await this.meetingModel
          .countDocuments(
            this.upcomingMeetingsFilter(
              filters.memberId,
              access.allowAllDepartments
                ? []
                : departmentIds.map((id) => new Types.ObjectId(id)),
            ),
          )
          .exec()) ??
        0,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(
        (task) => String(task.status).toLowerCase() === 'done',
      ).length,
      pendingTasks: tasks.filter(
        (task) => String(task.status).toLowerCase() !== 'done',
      ).length,
      overdueTasks: tasks.filter(
        (task) =>
          task.deadline &&
          new Date(task.deadline).getTime() < Date.now() &&
          String(task.status).toLowerCase() !== 'done',
      ).length,
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
    const access = await this.resolveAccess(userId, departmentId);
    if (
      !access.allowAllDepartments &&
      !access.allowedDepartmentIds.includes(departmentId)
    ) {
      throw new ForbiddenException('You cannot access this department');
    }

    const department = await this.departmentModel
      .findById(departmentId)
      .select('_id name')
      .lean()
      .exec();
    if (!department)
      throw new NotFoundException(`Department ${departmentId} not found`);

    const members = await this.userModel
      .find({
        memberships: {
          $elemMatch: { departmentId: new Types.ObjectId(departmentId) },
        },
      })
      .select('_id fullName')
      .lean()
      .exec();
    const memberIds = members.map((member) => String(member._id));
    const tasks = await this.taskModel
      .find({
        assignedTo: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
      })
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
    const access = await this.resolveAccess(userId, undefined, memberId);
    const member = await this.userModel
      .findById(memberId)
      .select('_id fullName email memberships')
      .lean()
      .exec();
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);

    const memberDepartmentIds = (member.memberships ?? [])
      .filter((m) => m.departmentId)
      .map((m) => String(m.departmentId));

    if (
      !access.allowAllDepartments &&
      !memberDepartmentIds.some((id) =>
        access.allowedDepartmentIds.includes(id),
      )
    ) {
      throw new ForbiddenException(
        'This member is outside your department scope',
      );
    }

    const tasks = await this.taskModel
      .find({ assignedTo: new Types.ObjectId(memberId) })
      .lean()
      .exec();
    const meetings = await this.meetingModel
      .find({ participants: new Types.ObjectId(memberId) })
      .populate('departmentId', 'name')
      .lean()
      .exec();
    const notes = await this.followupModel
      .find({ memberId: new Types.ObjectId(memberId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      member: {
        _id: member._id,
        fullName: member.fullName,
        email: member.email,
        departments: memberDepartmentIds,
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
      (task) => String(task.status ?? '').toLowerCase() !== 'done',
    ).length;
    const overdueTasks = tasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return (
        !!deadline &&
        deadline.getTime() < Date.now() &&
        String(task.status ?? '').toLowerCase() !== 'done'
      );
    }).length;
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
      overdueTasks,
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
      (task) => String(task.status ?? '').toLowerCase() !== 'done',
    ).length;
    const overdueTasks = tasks.filter((task) => {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return (
        !!deadline &&
        deadline.getTime() < Date.now() &&
        String(task.status ?? '').toLowerCase() !== 'done'
      );
    }).length;

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
      overdueTasks,
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
    const user = await this.userModel
      .findById(userId)
      .select('isAdmin role memberships activeMembershipId')
      .lean()
      .exec();

    if (!user) throw new ForbiddenException('User session is invalid');
    if (user.isAdmin || (user.role ?? []).includes('President')) {
      return {
        allowAllDepartments: true,
        allowedDepartmentIds: [],
        role: 'President',
      };
    }

    const activeMembership = (user.memberships ?? []).find(
      (membership: any) =>
        String(membership._id) === String(user.activeMembershipId),
    );
    const role = activeMembership?.role ?? 'Member';

    const allowedDepartmentIds = new Set<string>();
    for (const membership of user.memberships ?? []) {
      if (membership.departmentId)
        allowedDepartmentIds.add(String(membership.departmentId));
    }

    if (role === 'Director Executive') {
      return { allowAllDepartments: true, allowedDepartmentIds: [], role };
    }

    if (departmentId && !allowedDepartmentIds.has(String(departmentId))) {
      throw new ForbiddenException('You do not have access to this department');
    }

    if (memberId) {
      const member = await this.userModel
        .findById(memberId)
        .select('memberships')
        .lean()
        .exec();
      const memberDepartmentIds = (member?.memberships ?? [])
        .filter((membership: any) => membership.departmentId)
        .map((membership: any) => String(membership.departmentId));
      const isAllowed = memberDepartmentIds.some((id) =>
        allowedDepartmentIds.has(id),
      );
      if (!isAllowed && role !== 'Director Executive') {
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
        memberships: {
          $elemMatch: { departmentId: new Types.ObjectId(departmentId) },
        },
      })
      .select('_id')
      .lean()
      .exec();
    return members.map((member) => String(member._id));
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
    return members.map((member) => String(member._id));
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
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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
