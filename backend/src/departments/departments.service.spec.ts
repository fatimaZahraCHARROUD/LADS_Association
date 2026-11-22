import { DepartmentsService } from './departments.service';
import { Types } from 'mongoose';

const departmentId = '64f000000000000000000001';
const managerId = '64f000000000000000000002';
const memberId = '64f000000000000000000003';

function populatedDepartmentQuery(department: object) {
  const query = {
    populate: jest.fn(),
    exec: jest.fn().mockResolvedValue(department),
  };
  query.populate.mockReturnValue(query);
  return query;
}

describe('DepartmentsService membership synchronization', () => {
  it('creates a Member membership for a department member assignment', async () => {
    const department = {
      _id: departmentId,
      manager: null,
      viceManager: null,
      teamManagers: [],
      members: [memberId],
    };
    const user = { memberships: [], activeMembershipId: null };
    const userModel = {
      countDocuments: jest.fn((query: { _id: { $in: unknown[] } }) =>
        Promise.resolve(query._id.$in.length),
      ),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      }),
    };
    const departmentModel = {
      create: jest.fn().mockResolvedValue(department),
      findById: jest.fn().mockReturnValue(populatedDepartmentQuery(department)),
    };
    const service = new DepartmentsService(
      departmentModel as never,
      userModel as never,
    );

    await service.create({
      name: 'Research',
      members: [memberId],
    });

    const [updatedUserId, patch] = userModel.findByIdAndUpdate.mock
      .calls[0] as [
      string,
      {
        memberships: Array<{
          _id: Types.ObjectId;
          role: string;
          departmentId: Types.ObjectId;
        }>;
        activeMembershipId: Types.ObjectId;
      },
    ];
    expect(updatedUserId).toBe(memberId);
    expect(patch.memberships).toHaveLength(1);
    expect(patch.memberships[0].role).toBe('Member');
    expect(String(patch.memberships[0].departmentId)).toBe(departmentId);
    expect(String(patch.activeMembershipId)).toBe(
      String(patch.memberships[0]._id),
    );
  });

  it('updates department manager assignments to Responsable memberships', async () => {
    const currentDepartment = {
      _id: departmentId,
      manager: null,
      viceManager: null,
      teamManagers: [],
      members: [],
    };
    const updatedDepartment = {
      ...currentDepartment,
      manager: managerId,
    };
    const user = { memberships: [], activeMembershipId: null };
    const userModel = {
      exists: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      }),
    };
    const departmentModel = {
      findById: jest
        .fn()
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(currentDepartment),
        })
        .mockReturnValueOnce(populatedDepartmentQuery(updatedDepartment)),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedDepartment),
      }),
    };
    const service = new DepartmentsService(
      departmentModel as never,
      userModel as never,
    );

    await service.assignManager(departmentId, managerId);

    const [, patch] = userModel.findByIdAndUpdate.mock.calls[0] as [
      string,
      {
        memberships: Array<{
          role: string;
          departmentId: Types.ObjectId;
        }>;
      },
    ];
    expect(patch.memberships[0].role).toBe('Responsable');
    expect(String(patch.memberships[0].departmentId)).toBe(departmentId);
  });
});
