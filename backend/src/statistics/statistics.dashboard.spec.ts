import { Types } from 'mongoose';
import { StatisticsService } from './statistics.service';

type MockQuery<T> = {
  select: (fields: string) => MockQuery<T>;
  populate: (path: string, fields: string) => MockQuery<T>;
  sort: (sort: Record<string, number>) => MockQuery<T>;
  limit: (count: number) => MockQuery<T>;
  lean: () => MockQuery<T>;
  exec: () => Promise<T>;
};

const query = <T>(value: T): MockQuery<T> => {
  const result: MockQuery<T> = {
    select: () => result,
    populate: () => result,
    sort: () => result,
    limit: () => result,
    lean: () => result,
    exec: () => Promise.resolve(value),
  };
  return result;
};

const countQuery = (value: number | null) => ({
  exec: () => Promise.resolve(value),
});

const noMeetings = {
  find: jest.fn().mockReturnValue(query([])),
  countDocuments: jest.fn().mockReturnValue(countQuery(0)),
};

describe('StatisticsService dashboard endpoints', () => {
  it('returns executive objective data, department summaries, and meetings', async () => {
    const managerId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const dates = [
      new Date('2026-10-30T12:00:00Z'),
      new Date('2026-10-29T12:00:00Z'),
      new Date('2026-10-28T12:00:00Z'),
      new Date('2026-10-27T12:00:00Z'),
    ];
    const department = {
      _id: departmentId,
      name: 'Research',
      manager: managerId,
      members: [new Types.ObjectId(), new Types.ObjectId()],
    };
    const objectives = [
      {
        _id: new Types.ObjectId(),
        title: 'Weekly objective',
        status: 'in-progress',
        progress: 35,
        weekStart: dates[3],
        weekEnd: dates[0],
        departmentId: { name: 'Research' },
        createdAt: dates[3],
        updatedAt: dates[3],
        createdBy: { fullName: 'Director' },
      },
    ];
    const meeting = {
      _id: new Types.ObjectId(),
      title: 'Recent meeting',
      departmentId: { name: 'Research' },
      createdAt: dates[1],
      updatedAt: dates[1],
      createdBy: { fullName: 'Director' },
      startAt: new Date('2026-11-03T10:00:00Z'),
    };
    const departmentModel = {
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
      find: jest.fn().mockReturnValue(query([department])),
    };
    const userModel = {
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([{ _id: departmentId, count: 2 }]),
      }),
      find: jest
        .fn()
        .mockReturnValue(
          query([{ _id: managerId, fullName: 'Department Manager' }]),
        ),
    };
    const projectModel = {
      countDocuments: jest.fn().mockReturnValue(countQuery(3)),
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([{ _id: departmentId, count: 2 }]),
      }),
    };
    let executiveMeetingFilter: Record<string, unknown> | undefined;
    const meetingModel = {
      ...noMeetings,
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        executiveMeetingFilter ??= filter;
        return query([meeting]);
      }),
      countDocuments: jest.fn().mockReturnValue(countQuery(2)),
    };
    const objectiveModel = {
      find: jest.fn().mockReturnValue(query(objectives)),
    };
    const service = new StatisticsService(
      departmentModel as never,
      userModel as never,
      projectModel as never,
      {} as never,
      meetingModel as never,
      objectiveModel as never,
      {} as never,
      {} as never,
    );

    const response = await service.getExecutiveDashboard();
    expect(response).toMatchObject({
      overview: {
        totalDepartments: 1,
        totalMembers: 2,
        totalProjects: 3,
        totalUpcomingMeetings: 2,
      },
      data: {
        objectives,
        departments: [
          {
            _id: departmentId,
            name: 'Research',
            membersCount: 2,
            projectsCount: 2,
            manager: 'Department Manager',
          },
        ],
        upcomingMeetings: [meeting],
      },
    });
    expect(response.data).not.toHaveProperty('projects');
    expect(response.data).not.toHaveProperty('recentActivities');
    expect(projectModel.countDocuments).toHaveBeenCalledWith({});
    expect(projectModel.aggregate).toHaveBeenCalledWith([
      { $match: { departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);
    expect(userModel.aggregate).toHaveBeenCalledWith([
      { $match: { isAdmin: { $ne: true }, status: 'active' } },
      { $unwind: '$memberships' },
      { $match: { 'memberships.departmentId': { $ne: null } } },
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
    ]);
    expect(executiveMeetingFilter?.status).toEqual({
      $ne: 'cancelled',
    });
    const executiveStartAt = executiveMeetingFilter?.startAt as
      | { $gte?: unknown }
      | undefined;
    expect(executiveStartAt?.$gte).toBeInstanceOf(Date);
    expect(meetingModel.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $ne: 'cancelled' } }),
    );
  });

  it('uses identical global totals for Admin and Executive dashboard responses', async () => {
    const userId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const department = {
      _id: departmentId,
      name: 'Research',
      manager: null,
      members: [],
    };
    const departments = {
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
      find: jest.fn().mockReturnValue(query([department])),
    };
    const users = {
      findById: jest.fn().mockReturnValue(
        query({
          _id: userId,
          isAdmin: true,
          role: ['President'],
          memberships: [],
        }),
      ),
      find: jest.fn().mockReturnValue(query([])),
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([{ _id: departmentId, count: 2 }]),
      }),
    };
    const projects = {
      countDocuments: jest.fn().mockReturnValue(countQuery(3)),
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([{ _id: departmentId, count: 2 }]),
      }),
    };
    const meetingCountFilters: Record<string, unknown>[] = [];
    const meetings = {
      find: jest.fn().mockReturnValue(query([])),
      countDocuments: jest
        .fn()
        .mockImplementation((filter: Record<string, unknown>) => {
          meetingCountFilters.push(filter);
          return countQuery(4);
        }),
    };
    const tasks = { find: jest.fn().mockReturnValue(query([])) };
    const activities = { find: jest.fn().mockReturnValue(query([])) };
    const objectives = { find: jest.fn().mockReturnValue(query([])) };
    const followups = { find: jest.fn().mockReturnValue(query([])) };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projects as never,
      tasks as never,
      meetings as never,
      objectives as never,
      activities as never,
      followups as never,
    );

    const adminResponse = await service.getDashboard(String(userId));
    const executiveResponse = await service.getExecutiveDashboard();
    const expectedTotals = {
      totalDepartments: 1,
      totalMembers: 2,
      totalProjects: 3,
      totalUpcomingMeetings: 4,
    };

    expect(adminResponse.overview).toMatchObject(expectedTotals);
    expect(executiveResponse.overview).toEqual(expectedTotals);
    expect(executiveResponse.data.departments[0].membersCount).toBe(
      expectedTotals.totalMembers,
    );
    expect(meetingCountFilters).toHaveLength(2);
    meetingCountFilters.forEach((filter) => {
      expect(filter.status).toEqual({ $ne: 'cancelled' });
      expect((filter.startAt as { $gte?: unknown }).$gte).toBeInstanceOf(Date);
    });
    expect(users.aggregate).toHaveBeenCalledWith([
      { $match: { isAdmin: { $ne: true }, status: 'active' } },
      { $unwind: '$memberships' },
      { $match: { 'memberships.departmentId': { $ne: null } } },
      { $group: { _id: '$_id' } },
      { $count: 'count' },
    ]);
  });

  it('scopes Team Manager projects, tasks, and meetings to managed departments and projects', async () => {
    const managerId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const department = {
      _id: departmentId,
      manager: null,
      viceManager: null,
      teamManagers: [managerId],
      members: [memberId],
    };
    const activeProject = {
      _id: new Types.ObjectId(),
      title: 'Active project',
      memberIds: [memberId],
      managerIds: [managerId],
    };
    const pendingTask = { _id: new Types.ObjectId(), title: 'Department task' };
    const meeting = { _id: new Types.ObjectId(), title: 'Team meeting' };
    let taskFilter: Record<string, unknown> | undefined;
    let meetingFilter: Record<string, unknown> | undefined;
    let projectFilter: Record<string, unknown> | undefined;
    const departments = {
      find: jest.fn().mockReturnValue(query([department])),
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
    };
    const users = {
      findById: jest.fn().mockReturnValue(
        query({
          isAdmin: false,
          role: ['Team Manager'],
          memberships: [{ role: 'Team Manager', departmentId }],
        }),
      ),
      countDocuments: jest.fn().mockReturnValue(countQuery(2)),
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([{ count: 2 }]),
      }),
    };
    const projects = {
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        projectFilter = filter;
        return query([activeProject]);
      }),
    };
    const taskQuery = query([pendingTask]);
    const taskLimit = jest.spyOn(taskQuery, 'limit');
    const tasks = {
      countDocuments: jest
        .fn()
        .mockImplementation((filter: Record<string, unknown>) => {
          taskFilter = filter;
          return countQuery(1);
        }),
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        taskFilter = filter;
        return taskQuery;
      }),
    };
    const meetings = {
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        meetingFilter = filter;
        return query([meeting]);
      }),
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projects as never,
      tasks as never,
      meetings as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.getTeamManagerDashboard(String(managerId));
    expect(response.overview).toMatchObject({
      totalDepartments: 1,
      totalMembers: 2,
      totalProjects: 1,
      totalPendingTasks: 1,
      totalUpcomingMeetings: 1,
    });
    expect(response.data).toMatchObject({
      activeProjects: [activeProject],
      pendingTasks: [pendingTask],
      upcomingMeetings: [meeting],
    });
    expect(projectFilter).toMatchObject({
      status: 'in_progress',
      $or: [
        { departmentId: { $in: [departmentId] } },
        { managerIds: managerId },
        { memberIds: managerId },
      ],
    });
    expect(projects.countDocuments).toHaveBeenCalledWith({
      departmentId: { $in: [departmentId] },
    });
    expect(users.aggregate).toHaveBeenCalledWith([
      { $match: { isAdmin: { $ne: true }, status: 'active' } },
      { $unwind: '$memberships' },
      { $match: { 'memberships.departmentId': { $ne: null } } },
      { $match: { 'memberships.departmentId': { $in: [departmentId] } } },
      { $group: { _id: '$_id' } },
      { $count: 'count' },
    ]);
    expect(taskFilter).toMatchObject({
      departmentId: { $in: [departmentId] },
      status: { $ne: 'done' },
    });
    expect(taskLimit).toHaveBeenCalledWith(5);
    expect(meetingFilter?.status).toEqual({
      $ne: 'cancelled',
    });
    const teamMeetingScope = meetingFilter?.$or;
    expect(Array.isArray(teamMeetingScope)).toBe(true);
    if (Array.isArray(teamMeetingScope)) {
      expect(teamMeetingScope).toContainEqual({
        departmentId: { $in: [departmentId] },
      });
      expect(teamMeetingScope).toContainEqual({
        department: { $in: [departmentId] },
      });
      expect(teamMeetingScope).not.toContainEqual({
        participants: managerId,
      });
    }
  });

  it('returns zero Team Manager counts and empty dynamic sections without scope data', async () => {
    const userId = new Types.ObjectId();
    const empty = query<never[]>([]);
    const departments = {
      find: jest.fn().mockReturnValue(empty),
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
    };
    const users = {
      findById: jest
        .fn()
        .mockReturnValue(
          query({ isAdmin: false, role: ['Team Manager'], memberships: [] }),
        ),
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      aggregate: jest.fn().mockReturnValue({
        exec: () => Promise.resolve([]),
      }),
    };
    const projects = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(empty),
    };
    const tasks = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(empty),
    };
    const meetings = {
      find: jest.fn().mockReturnValue(empty),
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projects as never,
      tasks as never,
      meetings as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.getTeamManagerDashboard(String(userId)),
    ).resolves.toEqual({
      overview: {
        totalDepartments: 0,
        totalMembers: 0,
        totalProjects: 0,
        totalPendingTasks: 0,
        totalUpcomingMeetings: 0,
      },
      data: { activeProjects: [], pendingTasks: [], upcomingMeetings: [] },
    });
  });

  it('adds current-week objective, team, task counts, and meetings to Responsable data', async () => {
    const responsableId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const objective = { _id: new Types.ObjectId(), title: 'Weekly objective' };
    const member = { _id: memberId, fullName: 'Team member' };
    const pendingTask = { _id: new Types.ObjectId(), title: 'Pending task' };
    const meeting = { _id: new Types.ObjectId(), title: 'Department meeting' };
    const departments = {
      find: jest
        .fn()
        .mockReturnValue(query([{ _id: departmentId, members: [memberId] }])),
    };
    const users = {
      findById: jest
        .fn()
        .mockReturnValue(
          query({ memberships: [{ role: 'Responsable', departmentId }] }),
        ),
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
      find: jest.fn().mockReturnValue(query([member])),
    };
    const tasks = {
      countDocuments: jest
        .fn()
        .mockReturnValueOnce(countQuery(1))
        .mockReturnValueOnce(countQuery(2)),
      find: jest.fn().mockReturnValue(query([pendingTask])),
    };
    const meetings = {
      find: jest.fn().mockReturnValue(query([meeting])),
      countDocuments: jest.fn().mockReturnValue(countQuery(3)),
    };
    let objectiveFilter: Record<string, unknown> | undefined;
    const objectives = {
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        objectiveFilter = filter;
        return query([objective]);
      }),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      {} as never,
      tasks as never,
      meetings as never,
      objectives as never,
      {} as never,
      {} as never,
    );

    const response = await service.getResponsableDashboard(
      String(responsableId),
    );
    expect(response.overview).toMatchObject({
      totalMembers: 1,
      totalPendingTasks: 1,
      totalCompletedTasks: 2,
      totalUpcomingMeetings: 3,
    });
    expect(response.data).toMatchObject({
      objectives: [objective],
      members: [member],
      pendingTasks: [pendingTask],
      upcomingMeetings: [meeting],
    });
    expect(objectiveFilter?.departmentId).toEqual({
      $in: [departmentId],
    });
    const objectiveWeekStart = objectiveFilter?.weekStart as
      | { $lte?: unknown }
      | undefined;
    const objectiveWeekEnd = objectiveFilter?.weekEnd as
      | { $gte?: unknown }
      | undefined;
    expect(objectiveWeekStart?.$lte).toBeInstanceOf(Date);
    expect(objectiveWeekEnd?.$gte).toBeInstanceOf(Date);
  });

  it('returns the authenticated Member profile, tasks, weekly focus, and scoped meetings', async () => {
    const memberId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const objectiveId = new Types.ObjectId();
    const task = {
      _id: new Types.ObjectId(),
      title: 'Member task',
      status: 'todo',
      objectiveId,
      deadline: new Date(),
    };
    const objective = {
      _id: objectiveId,
      title: 'Member objective',
      weekStart: new Date(),
      weekEnd: new Date(),
    };
    const meeting = { _id: new Types.ObjectId(), title: 'Member meeting' };
    let meetingFilter: Record<string, unknown> | undefined;
    const departments = {
      find: jest
        .fn()
        .mockReturnValue(
          query([{ _id: departmentId, name: 'Member department' }]),
        ),
    };
    const users = {
      findById: jest.fn().mockReturnValue(
        query({
          fullName: 'Member Name',
          email: 'member@example.org',
          date_adhesion: '2024-03-01',
          memberships: [{ role: 'Member', departmentId }],
          departement: [],
        }),
      ),
    };
    const tasks = {
      find: jest.fn().mockReturnValue(query([task])),
      countDocuments: jest
        .fn()
        .mockReturnValueOnce(countQuery(2))
        .mockReturnValueOnce(countQuery(1)),
    };
    const objectives = {
      find: jest.fn().mockReturnValue(query([objective])),
    };
    const meetings = {
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        meetingFilter = filter;
        return query([meeting]);
      }),
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      {} as never,
      tasks as never,
      meetings as never,
      objectives as never,
      {} as never,
      {} as never,
    );

    const response = await service.getMemberDashboard(String(memberId));
    expect(response).toMatchObject({
      user: {
        fullName: 'Member Name',
        email: 'member@example.org',
        dateAdhesion: '2024-03-01',
      },
      overview: {
        totalTasks: 2,
        totalCompletedTasks: 1,
        totalPendingTasks: 1,
        totalUpcomingMeetings: 1,
      },
      data: {
        departments: [{ _id: departmentId, name: 'Member department' }],
        upcomingMeetings: [meeting],
      },
    });
    expect(response.data.thisWeek.objectives).toEqual([objective]);
    expect(response.data.tasks[0]).toMatchObject({
      ...task,
      objectiveId: objective,
    });
    const memberMeetingScope = meetingFilter?.$or;
    expect(Array.isArray(memberMeetingScope)).toBe(true);
    if (Array.isArray(memberMeetingScope)) {
      expect(memberMeetingScope).toContainEqual({
        departmentId: { $in: [departmentId] },
      });
      expect(memberMeetingScope).toContainEqual({ participants: memberId });
    }
  });
});
