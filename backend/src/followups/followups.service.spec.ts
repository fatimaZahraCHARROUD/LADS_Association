import { ForbiddenException } from '@nestjs/common';
import { FollowupsService } from './followups.service';

describe('FollowupsService', () => {
  const authorId = '507f1f77bcf86cd799439010';
  const departmentId = '507f1f77bcf86cd799439013';
  const memberId = '507f1f77bcf86cd799439014';

  const buildService = () => {
    const followupModel = {
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    const userModel = { findById: jest.fn() };
    const departmentModel = {
      exists: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

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
        _id: authorId,
        fullName: 'Alice',
        memberships: [
          { _id: authorId, departmentId, role: 'Team Manager' },
        ],
        activeMembershipId: authorId,
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
        departmentId: { _id: departmentId, name: 'Operations' },
        memberId: { _id: memberId, fullName: 'Bob' },
        author: { _id: authorId, fullName: 'Alice', email: 'alice@test.com', role: 'Team Manager' },
      }),
    });

    const result = await service.create(authorId, {
      text: 'hello',
      departmentId,
      memberId,
      noteType: 'info',
    } as any);

    expect(followupModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'hello',
        author: authorId,
        authorName: 'Alice',
        authorRole: 'Team Manager',
        noteType: 'info',
      }),
    );
    expect(result.authorName).toBe('Alice');
    expect(result.authorRole).toBe('Team Manager');
  });

  it('stores President as the note author role for a global administrator', async () => {
    const { service, followupModel, userModel } = buildService();
    const admin = {
      _id: authorId,
      fullName: 'Admin',
      isAdmin: true,
      role: ['President'],
      memberships: [{ _id: authorId, role: 'Member' }],
      activeMembershipId: authorId,
    };

    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(admin),
    });
    followupModel.create.mockResolvedValue({ _id: 'note-1' });
    followupModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: 'note-1', authorRole: 'President' }),
    });

    await service.create(authorId, { text: 'Admin note' } as any);

    expect(followupModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorRole: 'President' }),
    );
  });

  it('allows owners to edit notes and blocks non-owners from deleting them', async () => {
    const { service, followupModel, userModel } = buildService();

    const note = {
      _id: '507f1f77bcf86cd799439016',
      author: authorId,
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
          author: { _id: authorId, fullName: 'Alice', email: 'alice@test.com', role: 'Team Manager' },
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
          _id: authorId,
          isAdmin: false,
          role: ['Team Manager'],
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: authorId,
          isAdmin: false,
          role: ['Team Manager'],
        }),
      });

    const updated = await service.update(authorId, note._id, {
      text: 'updated text',
      noteType: 'warning',
    } as any);

    expect(updated.text).toBe('updated text');
    expect(updated.noteType).toBe('warning');
    await expect(service.remove(authorId, note._id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('blocks users from editing notes they do not own', async () => {
    const { service, followupModel, userModel } = buildService();
    const note = {
      author: '507f1f77bcf86cd799439017',
      text: 'another author note',
      save: jest.fn(),
    };
    followupModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(note),
    });
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        isAdmin: false,
        role: ['Team Manager'],
      }),
    });

    await expect(
      service.update(authorId, '507f1f77bcf86cd799439016', {
        text: 'attempted edit',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(note.save).not.toHaveBeenCalled();
  });

  it('applies note filters and blocks same-role cross-department access', async () => {
    const { service, followupModel, userModel } = buildService();

    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: authorId,
        isAdmin: false,
        role: ['Team Manager'],
        memberships: [{ _id: authorId, departmentId, role: 'Team Manager' }],
        activeMembershipId: authorId,
      }),
    });

    const query = {
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    followupModel.find.mockReturnValue(query);

    await service.findAll(authorId, {
      departmentId,
      memberId,
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
        departmentId: expect.anything(),
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      }),
    );
    expect(
      followupModel.find.mock.calls[0][0].createdAt.$lte.toISOString(),
    ).toBe('2026-01-31T23:59:59.999Z');
    expect(
      String(followupModel.find.mock.calls[0][0].departmentId),
    ).toBe('507f1f77bcf86cd799439013');

    userModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: authorId,
        fullName: 'Alice',
        memberships: [{ _id: authorId, departmentId, role: 'Team Manager' }],
        activeMembershipId: authorId,
        role: ['Team Manager'],
      }),
    });

    await expect(
      service.create(authorId, {
        text: 'outside scope',
        departmentId: '507f1f77bcf86cd799439018',
      } as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
