import { Types } from 'mongoose';
import { StatisticsService } from './statistics.service';

type MockQuery<T> = {
  select: (fields: string) => MockQuery<T>;
  populate: (path: string, fields: string) => MockQuery<T>;
  sort: (sort: Record<string, number>) => MockQuery<T>;
  lean: () => MockQuery<T>;
  exec: () => Promise<T>;
};

const query = <T>(value: T): MockQuery<T> => {
  const result: MockQuery<T> = {
    select: () => result,
    populate: () => result,
    sort: () => result,
    lean: () => result,
    exec: () => Promise.resolve(value),
  };
  return result;
};

const countQuery = (value: number | null) => ({
  exec: () => Promise.resolve(value),
});

describe('StatisticsService dashboard endpoints', () => {
  it('returns global counts and dynamic executive records', async () => {
    const objectives = [{ _id: 'objective-1', title: 'Objective' }];
    const projects = [{ _id: 'project-1', title: 'Project' }];
    const departments = {
      countDocuments: jest.fn().mockReturnValue(countQuery(2)),
    };
    const users = {
      countDocuments: jest.fn().mockReturnValue(countQuery(8)),
    };
    const projectModel = {
      countDocuments: jest.fn().mockReturnValue(countQuery(3)),
      find: jest.fn().mockReturnValue(query(projects)),
    };
    const objectiveModel = {
      find: jest.fn().mockReturnValue(query(objectives)),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projectModel as never,
      {} as never,
      {} as never,
      objectiveModel as never,
      {} as never,
      {} as never,
    );

    await expect(service.getExecutiveDashboard()).resolves.toEqual({
      overview: {
        totalDepartments: 2,
        totalMembers: 8,
        totalProjects: 3,
      },
      data: { objectives, projects },
    });
    expect(departments.countDocuments).toHaveBeenCalledWith({});
    expect(users.countDocuments).toHaveBeenCalledWith({
      isAdmin: { $ne: true },
    });
    expect(projectModel.countDocuments).toHaveBeenCalledWith({});
  });

  it('scopes Team Manager counts and active projects to managed departments', async () => {
    const managerId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const department = {
      _id: departmentId,
      manager: null,
      viceManager: null,
      teamManagers: [managerId],
      members: [],
    };
    const activeProjects = [{ _id: 'project-1', title: 'Active project' }];
    let departmentFilter: Record<string, unknown> | undefined;
    let memberFilter: Record<string, unknown> | undefined;
    let projectFilter: Record<string, unknown> | undefined;
    let activeProjectFilter: Record<string, unknown> | undefined;

    const departments = {
      find: (filter: Record<string, unknown>) => {
        departmentFilter = filter;
        return query([department]);
      },
      countDocuments: (filter: Record<string, unknown>) => {
        departmentFilter = filter;
        return countQuery(1);
      },
    };
    const users = {
      findById: () =>
        query({
          isAdmin: false,
          role: ['Team Manager'],
          memberships: [{ role: 'Team Manager', departmentId }],
        }),
      countDocuments: (filter: Record<string, unknown>) => {
        memberFilter = filter;
        return countQuery(4);
      },
    };
    const projectModel = {
      countDocuments: (filter: Record<string, unknown>) => {
        projectFilter = filter;
        return countQuery(2);
      },
      find: (filter: Record<string, unknown>) => {
        activeProjectFilter = filter;
        return query(activeProjects);
      },
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projectModel as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.getTeamManagerDashboard(String(managerId)),
    ).resolves.toEqual({
      overview: {
        totalDepartments: 1,
        totalMembers: 4,
        totalProjects: 2,
      },
      data: { activeProjects },
    });
    expect(departmentFilter).toEqual({ _id: { $in: [departmentId] } });
    expect(memberFilter).toEqual({
      isAdmin: { $ne: true },
      $or: [
        { _id: { $in: [managerId] } },
        {
          memberships: {
            $elemMatch: {
              departmentId: { $in: [departmentId] },
            },
          },
        },
        { departement: { $in: [departmentId] } },
      ],
    });
    expect(projectFilter).toEqual({
      $or: [
        { departmentId: { $in: [departmentId] } },
        { managerIds: managerId },
        { memberIds: managerId },
      ],
    });
    expect(activeProjectFilter).toEqual({
      status: 'in_progress',
      $or: projectFilter?.$or,
    });
  });

  it('returns zero counts when no dashboard records match', async () => {
    const userId = new Types.ObjectId();
    const emptyQuery = query<never[]>([]);
    const departments = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(emptyQuery),
    };
    const users = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      findById: jest.fn().mockReturnValue(
        query({
          isAdmin: false,
          role: ['Team Manager'],
          memberships: [],
        }),
      ),
    };
    const projects = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(emptyQuery),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      projects as never,
      {} as never,
      {} as never,
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
      },
      data: { activeProjects: [] },
    });
  });

  it('scopes Responsable members, tasks, and objectives to assigned departments', async () => {
    const responsableId = new Types.ObjectId();
    const departmentId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const objectives = [{ _id: 'objective-1', title: 'Weekly objective' }];
    const members = [{ _id: memberId, fullName: 'Team member' }];
    const pendingTasks = [{ _id: 'task-1', title: 'Pending task' }];
    let memberFilter: Record<string, unknown> | undefined;
    const departments = {
      find: jest
        .fn()
        .mockReturnValue(query([{ _id: departmentId, members: [memberId] }])),
    };
    const users = {
      findById: jest.fn().mockReturnValue(
        query({
          memberships: [{ role: 'Responsable', departmentId }],
        }),
      ),
      countDocuments: (filter: Record<string, unknown>) => {
        memberFilter = filter;
        return countQuery(1);
      },
      find: () => query(members),
    };
    const tasks = {
      countDocuments: jest.fn().mockReturnValue(countQuery(1)),
      find: () => query(pendingTasks),
    };
    const objectiveModel = {
      find: jest.fn().mockReturnValue(query(objectives)),
    };
    const service = new StatisticsService(
      departments as never,
      users as never,
      {} as never,
      tasks as never,
      {} as never,
      objectiveModel as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.getResponsableDashboard(String(responsableId)),
    ).resolves.toEqual({
      overview: {
        totalMembers: 1,
        totalPendingTasks: 1,
        totalCompletedTasks: 1,
      },
      data: { objectives, members, pendingTasks },
    });
    expect(memberFilter).toEqual({
      _id: { $ne: responsableId },
      isAdmin: { $ne: true },
      $or: [
        { _id: { $in: [memberId] } },
        {
          memberships: {
            $elemMatch: {
              departmentId: { $in: [departmentId] },
              role: 'Member',
            },
          },
        },
        { departement: { $in: [departmentId] }, role: 'Member' },
      ],
    });
    expect(objectiveModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: { $in: [departmentId] } }),
    );
  });

  it('returns zero Responsable counts and empty sections when no team data exists', async () => {
    const responsableId = new Types.ObjectId();
    const emptyQuery = query<never[]>([]);
    const users = {
      findById: () =>
        query({
          memberships: [],
        }),
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(emptyQuery),
    };
    const tasks = {
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
      find: jest.fn().mockReturnValue(emptyQuery),
    };
    const service = new StatisticsService(
      {} as never,
      users as never,
      {} as never,
      tasks as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.getResponsableDashboard(String(responsableId)),
    ).resolves.toEqual({
      overview: {
        totalMembers: 0,
        totalPendingTasks: 0,
        totalCompletedTasks: 0,
      },
      data: { objectives: [], members: [], pendingTasks: [] },
    });
  });

  it('returns the authenticated Member profile, assigned tasks, and weekly objectives', async () => {
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
    let taskFilter: Record<string, unknown> | undefined;
    const users = {
      findById: jest.fn().mockReturnValue(
        query({
          fullName: 'Member Name',
          memberships: [{ role: 'Member', departmentId }],
          departement: [],
        }),
      ),
    };
    const tasks = {
      find: (filter: Record<string, unknown>) => {
        taskFilter = filter;
        return query([task]);
      },
      countDocuments: jest
        .fn()
        .mockReturnValueOnce(countQuery(2))
        .mockReturnValueOnce(countQuery(1)),
    };
    let objectiveFilter: Record<string, unknown> | undefined;
    const objectiveModel = {
      find: (filter: Record<string, unknown>) => {
        objectiveFilter = filter;
        return query([objective]);
      },
    };
    const service = new StatisticsService(
      {} as never,
      users as never,
      {} as never,
      tasks as never,
      {} as never,
      objectiveModel as never,
      {} as never,
      {} as never,
    );

    await expect(service.getMemberDashboard(String(memberId))).resolves.toEqual(
      {
        user: { fullName: 'Member Name' },
        overview: { totalTasks: 2, totalCompletedTasks: 1 },
        data: {
          thisWeek: {
            tasks: [{ ...task, objectiveId: objective }],
            objectives: [objective],
          },
          tasks: [{ ...task, objectiveId: objective }],
        },
      },
    );
    expect(taskFilter).toEqual({ assignedTo: memberId });
    expect(objectiveFilter?.$or).toEqual(
      expect.arrayContaining([
        { departmentId: { $in: [departmentId] } },
        { _id: { $in: [objectiveId] } },
      ]),
    );
  });

  it('returns zero Member counts and empty data when no records exist', async () => {
    const memberId = new Types.ObjectId();
    const emptyQuery = query<never[]>([]);
    const users = {
      findById: () =>
        query({
          fullName: 'Member Name',
          memberships: [],
          departement: [],
        }),
    };
    const tasks = {
      find: () => emptyQuery,
      countDocuments: jest.fn().mockReturnValue(countQuery(null)),
    };
    const service = new StatisticsService(
      {} as never,
      users as never,
      {} as never,
      tasks as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getMemberDashboard(String(memberId))).resolves.toEqual(
      {
        user: { fullName: 'Member Name' },
        overview: { totalTasks: 0, totalCompletedTasks: 0 },
        data: { thisWeek: { tasks: [], objectives: [] }, tasks: [] },
      },
    );
  });
});
