import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const taskId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';
  const activeMembershipId = '507f1f77bcf86cd799439013';
  const activeDepartmentId = '507f1f77bcf86cd799439014';
  const otherDepartmentId = '507f1f77bcf86cd799439015';

  const query = <T>(value: T) => ({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  });

  const buildService = () => {
    const taskModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    const userModel = {
      findById: jest.fn(),
      exists: jest.fn(),
    };
    const objectiveModel = { findById: jest.fn(), exists: jest.fn() };
    const departmentModel = {
      findById: jest.fn(),
      exists: jest.fn(),
    };

    return {
      service: new TasksService(
        taskModel as any,
        userModel as any,
        objectiveModel as any,
        departmentModel as any,
      ),
      taskModel,
      userModel,
      departmentModel,
    };
  };

  it('prevents a department manager from changing a task outside the active department', async () => {
    const { service, taskModel, userModel } = buildService();
    taskModel.findById.mockReturnValue(
      query({
        _id: taskId,
        assignedTo: new Types.ObjectId(userId),
        departmentId: new Types.ObjectId(otherDepartmentId),
        status: 'todo',
        completedAt: null,
      }),
    );
    userModel.findById.mockReturnValue(
      query({
        isAdmin: false,
        role: [],
        memberships: [
          {
            _id: new Types.ObjectId(activeMembershipId),
            departmentId: new Types.ObjectId(activeDepartmentId),
            role: 'Team Manager',
          },
        ],
        activeMembershipId: new Types.ObjectId(activeMembershipId),
      }),
    );

    await expect(
      service.updateStatus(taskId, 'done', userId),
    ).rejects.toThrow(ForbiddenException);
    expect(taskModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('persists the existing done status value and completion timestamp', async () => {
    const { service, taskModel, userModel } = buildService();
    const task = {
      _id: new Types.ObjectId(taskId),
      assignedTo: new Types.ObjectId(userId),
      departmentId: new Types.ObjectId(activeDepartmentId),
      status: 'todo',
      completedAt: null,
    };
    taskModel.findById.mockReturnValue(query(task));
    userModel.findById.mockReturnValue(
      query({
        isAdmin: true,
        role: [],
        memberships: [],
        activeMembershipId: null,
      }),
    );
    const updateQuery = {
      populate: jest.fn(),
      exec: jest.fn().mockResolvedValue({ ...task, status: 'done' }),
    };
    updateQuery.populate.mockReturnValue(updateQuery);
    taskModel.findByIdAndUpdate.mockReturnValue(updateQuery);

    await service.updateStatus(taskId, 'done', userId);

    expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      expect.objectContaining({
        status: 'done',
        completedAt: expect.any(Date),
      }),
      expect.objectContaining({ runValidators: true }),
    );
  });
});
