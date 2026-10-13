import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  const buildService = () =>
    new StatisticsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

  it('aggregates counts and progress without double-counting tasks', () => {
    const service = buildService();

    const result = service.calculateDepartmentSummary({
      departmentName: 'Operations',
      members: [
        { _id: 'm1', fullName: 'Alice' },
        { _id: 'm2', fullName: 'Bob' },
      ],
      tasks: [
        { assignedTo: 'm1', status: 'done', deadline: new Date('2026-10-01') },
        { assignedTo: 'm1', status: 'done', deadline: new Date('2026-10-11') },
        { assignedTo: 'm2', status: 'todo', deadline: new Date('2026-10-20') },
        {
          assignedTo: 'm1',
          status: 'in-progress',
          deadline: new Date('2026-10-05'),
        },
      ],
      meetings: [
        { _id: 'mt1', startAt: new Date('2026-10-02') },
        { _id: 'mt2', startAt: new Date('2026-10-04') },
      ],
      objectives: [
        { progress: 60, status: 'in-progress' },
        { progress: 100, status: 'completed' },
      ],
      notes: [{ createdAt: new Date('2026-10-08') }],
    });

    expect(result.totalMembers).toBe(2);
    expect(result.totalTasks).toBe(4);
    expect(result.completedTasks).toBe(2);
    expect(result.pendingTasks).toBe(2);
    expect(result.overdueTasks).toBe(1);
    expect(result.meetingsHeld).toBe(2);
    expect(result.currentProgress).toBe(80);
  });

  it('creates an empty summary when there is no data', () => {
    const service = buildService();

    const result = service.calculateDepartmentSummary({
      departmentName: 'Empty',
      members: [],
      tasks: [],
      meetings: [],
      objectives: [],
      notes: [],
    });

    expect(result.totalMembers).toBe(0);
    expect(result.totalTasks).toBe(0);
    expect(result.completedTasks).toBe(0);
    expect(result.pendingTasks).toBe(0);
    expect(result.overdueTasks).toBe(0);
    expect(result.meetingsHeld).toBe(0);
    expect(result.currentProgress).toBe(0);
  });

  it('builds weekly and monthly activity trends from the underlying records', () => {
    const service = buildService();
    const from = new Date('2026-10-01T00:00:00.000Z');
    const to = new Date('2026-10-07T23:59:59.999Z');

    const trend = (service as any).buildTrend(
      [
        { createdAt: new Date('2026-10-01T08:00:00.000Z'), title: 'Task A' },
        { createdAt: new Date('2026-10-03T09:00:00.000Z'), title: 'Task B' },
      ],
      [{ startAt: new Date('2026-10-02T10:00:00.000Z'), title: 'Planning' }],
      [{ createdAt: new Date('2026-10-01T12:00:00.000Z'), title: 'Launch' }],
      from,
      to,
    );

    expect(trend).toHaveLength(8);
    expect(trend[0].tasks).toBe(1);
    expect(trend[0].activities).toBe(1);
    expect(trend[1].meetings).toBe(1);
    expect(trend[2].tasks).toBe(1);
  });

  it('calculates member activity using the real task, meeting and note data model', () => {
    const service = buildService();

    const result = service.calculateMemberSummary({
      memberId: 'member-1',
      tasks: [
        { status: 'todo', deadline: new Date('2020-01-01T00:00:00.000Z') },
        { status: 'done', deadline: new Date('2027-01-01T00:00:00.000Z') },
      ],
      meetings: [{ startAt: new Date('2026-10-03T00:00:00.000Z') }],
      notes: [
        { createdAt: new Date('2026-10-04T00:00:00.000Z'), text: 'Follow-up A' },
      ],
    });

    expect(result.memberId).toBe('member-1');
    expect(result.totalAssignedTasks).toBe(2);
    expect(result.completedTasks).toBe(1);
    expect(result.pendingTasks).toBe(1);
    expect(result.overdueTasks).toBe(1);
    expect(result.meetingsAttended).toBe(1);
    expect(result.recentFollowUpCount).toBe(1);
    expect(result.lastActivityDate).not.toBeNull();
  });
});
