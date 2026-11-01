import { AuthService } from './auth.service';

describe('AuthService login active membership', () => {
  const membership = {
    _id: 'membership-responsable',
    role: 'Responsable',
    departmentId: 'department-1',
  };

  it('repairs a stale active membership id to a valid membership', async () => {
    const user = {
      _id: 'user-1',
      email: 'admin@example.org',
      fullName: 'Admin User',
      password: 'stored-hash',
      role: ['President'],
      isAdmin: true,
      activeMembershipId: 'stale-membership-id',
      memberships: [membership],
    };
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      setActiveMembership: jest.fn().mockResolvedValue(undefined),
    };
    const hashService = { compare: jest.fn().mockResolvedValue(true) };
    const jwtService = { sign: jest.fn().mockReturnValue('token') };
    const service = new AuthService(
      usersService as never,
      hashService as never,
      jwtService as never,
    );

    const result = await service.login(user.email, 'password');

    expect(usersService.setActiveMembership).toHaveBeenCalledWith(
      'user-1',
      'membership-responsable',
    );
    expect(result.user.activeMembershipId).toBe('membership-responsable');
    expect(result.user.memberships).toEqual([membership]);
  });

  it('preserves an existing valid active membership', async () => {
    const user = {
      _id: 'user-1',
      email: 'member@example.org',
      fullName: 'Member User',
      password: 'stored-hash',
      role: ['Member'],
      isAdmin: false,
      activeMembershipId: membership._id,
      memberships: [membership],
    };
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      setActiveMembership: jest.fn().mockResolvedValue(undefined),
    };
    const hashService = { compare: jest.fn().mockResolvedValue(true) };
    const jwtService = { sign: jest.fn().mockReturnValue('token') };
    const service = new AuthService(
      usersService as never,
      hashService as never,
      jwtService as never,
    );

    const result = await service.login(user.email, 'password');

    expect(usersService.setActiveMembership).not.toHaveBeenCalled();
    expect(result.user.activeMembershipId).toBe(membership._id);
  });
});

describe('AuthService switchRole', () => {
  const switchableMembership = {
    _id: 'membership-responsable',
    role: 'Responsable',
    departmentId: 'department-1',
  };

  it('returns the membership id confirmed by persistence', async () => {
    const user = {
      _id: 'user-1',
      memberships: [switchableMembership],
    };
    const updatedUser = {
      activeMembershipId: switchableMembership._id,
      memberships: [switchableMembership],
    };
    const usersService = {
      findOne: jest.fn().mockResolvedValue(user),
      setActiveMembership: jest.fn().mockResolvedValue(updatedUser),
    };
    const service = new AuthService(
      usersService as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.switchRole('user-1', switchableMembership._id),
    ).resolves.toEqual({
      message: 'Role switched',
      activeMembership: switchableMembership,
      activeMembershipId: switchableMembership._id,
      memberships: [switchableMembership],
    });
    expect(usersService.setActiveMembership).toHaveBeenCalledWith(
      'user-1',
      switchableMembership._id,
    );
  });

  it('does not report success when the active membership was not persisted', async () => {
    const usersService = {
      findOne: jest.fn().mockResolvedValue({
        _id: 'user-1',
        memberships: [switchableMembership],
      }),
      setActiveMembership: jest.fn().mockResolvedValue({
        activeMembershipId: 'another-membership',
        memberships: [switchableMembership],
      }),
    };
    const service = new AuthService(
      usersService as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.switchRole('user-1', switchableMembership._id),
    ).rejects.toThrow('The selected membership could not be persisted');
  });
});
