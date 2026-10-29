import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import mongoose, { Types } from 'mongoose';
import {
  Department,
  DepartmentSchema,
} from '../src/departments/schemas/department.schema';
import {
  Objective,
  ObjectiveSchema,
} from '../src/objectives/schemas/objective.schema';
import { Project, ProjectSchema } from '../src/projects/schemas/project.schema';
import { User, UserSchema } from '../src/users/schemas/user.schema';

const EXEC_EMAIL = process.env.SEED_EXEC_EMAIL?.trim().toLowerCase();
const TEAM_MANAGER_EMAIL = process.env.SEED_TEAM_MANAGER_EMAIL
  ?.trim()
  .toLowerCase();
const SAMPLE_MEMBER_EMAIL = (
  process.env.SEED_SAMPLE_MEMBER_EMAIL ?? 'dashboard.sample.member@lads.org'
)
  .trim()
  .toLowerCase();

function requireAccountEmails() {
  if (!EXEC_EMAIL || !TEAM_MANAGER_EMAIL) {
    throw new Error(
      'Set SEED_EXEC_EMAIL and SEED_TEAM_MANAGER_EMAIL to existing account emails.',
    );
  }
}

function withMembership(
  user: User,
  departmentId: Types.ObjectId | null,
  role: string,
) {
  const memberships = (user.memberships ?? []).map((membership) => ({
    _id: membership._id,
    departmentId: membership.departmentId ?? null,
    role: membership.role,
  }));
  let membership = memberships.find(
    (item) =>
      String(item.departmentId ?? '') === String(departmentId ?? '') &&
      item.role === role,
  );

  if (!membership) {
    membership = {
      _id: new Types.ObjectId(),
      departmentId,
      role,
    };
    memberships.push(membership);
  }

  return { memberships, membership };
}

async function seedDashboardSample() {
  requireAccountEmails();
  await mongoose.connect(
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS',
  );

  const UserModel = mongoose.model(User.name, UserSchema);
  const DepartmentModel = mongoose.model(Department.name, DepartmentSchema);
  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const ObjectiveModel = mongoose.model(Objective.name, ObjectiveSchema);

  try {
    const executive = await UserModel.findOne({ email: EXEC_EMAIL }).exec();
    const teamManager = await UserModel.findOne({
      email: TEAM_MANAGER_EMAIL,
    }).exec();
    if (!executive) throw new Error(`Exec account not found: ${EXEC_EMAIL}`);
    if (!teamManager) {
      throw new Error(`Team Manager account not found: ${TEAM_MANAGER_EMAIL}`);
    }

    const isExecutive =
      executive.isAdmin ||
      (executive.role ?? []).includes('President') ||
      (executive.role ?? []).includes('Director Executive') ||
      (executive.memberships ?? []).some(
        (membership) => membership.role === 'Director Executive',
      );
    if (!isExecutive) {
      throw new Error('SEED_EXEC_EMAIL must belong to a Director Executive or admin.');
    }
    if (
      !(teamManager.role ?? []).includes('Team Manager') &&
      !(teamManager.memberships ?? []).some(
        (membership) => membership.role === 'Team Manager',
      )
    ) {
      throw new Error('SEED_TEAM_MANAGER_EMAIL must belong to a Team Manager.');
    }

    const samplePassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    const sampleMember = await UserModel.findOneAndUpdate(
      { email: SAMPLE_MEMBER_EMAIL },
      {
        $setOnInsert: {
          fullName: 'Dashboard Sample Member',
          email: SAMPLE_MEMBER_EMAIL,
          password: samplePassword,
          membershipNumber: 'DASHBOARD-DEMO',
          role: ['Member'],
          memberships: [],
          activeMembershipId: null,
          departement: [],
          status: 'active',
          isAdmin: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
    if (!sampleMember) throw new Error('Could not create the sample member.');

    const department = await DepartmentModel.findOneAndUpdate(
      { name: 'Dashboard Sample Department' },
      {
        $set: {
          manager: null,
          viceManager: null,
          teamManagers: [teamManager._id],
          members: [sampleMember._id],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
    if (!department) throw new Error('Could not create the sample department.');

    const teamMembership = withMembership(
      teamManager,
      department._id,
      'Team Manager',
    );
    await UserModel.updateOne(
      { _id: teamManager._id },
      {
        $set: {
          memberships: teamMembership.memberships,
          activeMembershipId: teamMembership.membership._id,
          role: Array.from(
            new Set([...(teamManager.role ?? []), 'Team Manager']),
          ),
          departement: Array.from(
            new Set([
              ...(teamManager.departement ?? []).map(String),
              String(department._id),
            ]),
          ).map((id) => new Types.ObjectId(id)),
        },
      },
    ).exec();

    const sampleMembership = withMembership(
      sampleMember,
      department._id,
      'Member',
    );
    await UserModel.updateOne(
      { _id: sampleMember._id },
      {
        $set: {
          memberships: sampleMembership.memberships,
          activeMembershipId: sampleMembership.membership._id,
          departement: [department._id],
          status: 'active',
          isAdmin: false,
        },
      },
    ).exec();

    let executiveId = executive._id;
    if (
      !executive.isAdmin &&
      !(executive.role ?? []).includes('President')
    ) {
      const executiveMembership = withMembership(
        executive,
        null,
        'Director Executive',
      );
      await UserModel.updateOne(
        { _id: executive._id },
        {
          $set: {
            memberships: executiveMembership.memberships,
            activeMembershipId: executiveMembership.membership._id,
            role: Array.from(
              new Set([...(executive.role ?? []), 'Director Executive']),
            ),
          },
        },
      ).exec();
      executiveId = executive._id;
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);
    await ProjectModel.findOneAndUpdate(
      { title: 'Dashboard Sample Active Project' },
      {
        $set: {
          description: 'Sample project used to verify dashboard data.',
          departmentId: department._id,
          managerIds: [teamManager._id],
          memberIds: [sampleMember._id],
          startDate: now,
          endDate: nextMonth,
          status: 'in_progress',
          progress: 35,
          createdBy: executiveId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    await ObjectiveModel.findOneAndUpdate(
      { title: 'Dashboard Sample Objective' },
      {
        $set: {
          description: 'Sample objective used to verify dashboard data.',
          departmentId: department._id,
          weekStart: nextWeek,
          weekEnd: twoWeeks,
          target: 10,
          achievement: 4,
          progress: 40,
          status: 'in-progress',
          createdBy: executiveId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    process.stdout.write(
      `Dashboard sample data ready.\nDepartment: ${department._id}\nSample member: ${sampleMember._id}\nTeam Manager: ${teamManager._id}\nExecutive: ${executiveId}\n`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedDashboardSample().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Dashboard sample seed failed: ${message}\n`);
  process.exitCode = 1;
});
