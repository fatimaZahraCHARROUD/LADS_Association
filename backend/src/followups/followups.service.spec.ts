import { ForbiddenException } from '@nestjs/common';
import { FollowupsService } from './followups.service';

describe('FollowupsService', () => {
  const buildService = () => {
    const followupModel = {
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    const userModel = { findById: jest.fn() };
    const departmentModel = {};

    return {
      service: new FollowupsService(
        followupModel as any,
        userModel as any,
        departmentModel as any,
      ),
      followupModel,
      userModel,
    };
  };

  it('stores the author identity and note metadata when creating a follow-up', async () => {
    const { service, followupModel, userModel } = buildService();

    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: 'u1',
        fullName: 'Alice',
        memberships: [{ _id: 'm1', departmentId: 'd1', role: 'Team Manager' }],
        activeMembershipId: 'm1',
        role: ['Team Manager'],
      }),
    });

    followupModel.create.mockResolvedValue({ _id: 'note-1' });
    followupModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: 'note-1',
        text: 'hello',
        noteType: 'info',
        authorName: 'Alice',
        authorRole: 'Team Manager',
        departmentId: { _id: 'd1', name: 'Operations' },
        memberId: { _id: 'u2', fullName: 'Bob' },
        author: { _id: 'u1', fullName: 'Alice', email: 'alice@test.com', role: 'Team Manager' },
      }),
    });

    const result = await service.create('u1', {
      text: 'hello',
      departmentId: 'd1',
      memberId: 'u2',
      noteType: 'info',
    } as any);

    expect(followupModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'hello',
        author: 'u1',
        authorName: 'Alice',
        authorRole: 'Team Manager',
        noteType: 'info',
      }),
    );
    expect(result.authorName).toBe('Alice');
    expect(result.authorRole).toBe('Team Manager');
  });

  it('allows owners to edit notes and blocks non-owners from deleting them', async () => {
    const { service, followupModel, userModel } = buildService();

    const note = {
      _id: 'note-1',
      author: 'u1',
      text: 'old text',
      noteType: 'info',
      save: jest.fn().mockResolvedValue(true),
    };

    followupModel.findById
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(note),
      })
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          ...note,
          text: 'updated text',
          noteType: 'warning',
          author: { _id: 'u1', fullName: 'Alice', email: 'alice@test.com', role: 'Team Manager' },
        }),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: 'note-1', author: 'u2' }),
      });

    userModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'u1',
          isAdmin: false,
          role: ['Team Manager'],
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'u1',
          isAdmin: false,
          role: ['Team Manager'],
        }),
      });

    const updated = await service.update('u1', 'note-1', {
      text: 'updated text',
      noteType: 'warning',
    } as any);

    expect(updated.text).toBe('updated text');
    expect(updated.noteType).toBe('warning');
    await expect(service.remove('u1', 'note-1')).rejects.toThrow(ForbiddenException);
  });

  it('applies note filters and blocks same-role cross-department access', async () => {
    const { service, followupModel, userModel } = buildService();

    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: 'u1',
        isAdmin: false,
        role: ['Team Manager'],
        memberships: [{ _id: '507f1f77bcf86cd799439010', departmentId: '507f1f77bcf86cd799439013', role: 'Team Manager' }],
        activeMembershipId: '507f1f77bcf86cd799439010',
      }),
    });

    const query = {
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    followupModel.find.mockReturnValue(query);

    await service.findAll('u1', {
      departmentId: '507f1f77bcf86cd799439013',
      memberId: '507f1f77bcf86cd799439014',
      authorId: '507f1f77bcf86cd799439015',
      noteType: 'warning',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(followupModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        noteType: 'warning',
        author: expect.anything(),
        memberId: expect.anything(),
        departmentId: { $in: [expect.anything()] },
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      }),
    );

    userModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: 'u1',
        fullName: 'Alice',
        memberships: [{ _id: '507f1f77bcf86cd799439010', departmentId: '507f1f77bcf86cd799439013', role: 'Team Manager' }],
        activeMembershipId: '507f1f77bcf86cd799439010',
        role: ['Team Manager'],
      }),
    });

    await expect(
      service.create('u1', { text: 'outside scope', departmentId: 'd2' } as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
