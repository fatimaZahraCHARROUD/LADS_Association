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
});
