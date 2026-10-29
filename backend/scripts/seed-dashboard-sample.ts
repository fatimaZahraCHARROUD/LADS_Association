import 'dotenv/config';
import { createHash } from 'node:crypto';
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
import { Task, TaskSchema } from '../src/tasks/schemas/task.schema';
import {
  User,
  UserDocument,
  UserSchema,
} from '../src/users/schemas/user.schema';

function requiredEmail(name: string) {
  const email = process.env[name]?.trim().toLowerCase();
  if (!email) throw new Error(`Set ${name} to an existing account email.`);
  return email;
}

function optionalEmail(name: string) {
  const email = process.env[name]?.trim().toLowerCase();
  return email || null;
}

const EXEC_EMAIL = optionalEmail('SEED_EXEC_EMAIL');
const TEAM_MANAGER_EMAIL = optionalEmail('SEED_TEAM_MANAGER_EMAIL');
const RESPONSABLE_EMAIL = requiredEmail('SEED_RESPONSABLE_EMAIL');
const MEMBER_EMAIL = requiredEmail('SEED_MEMBER_EMAIL');

function membershipId(
  email: string,
  role: string,
  departmentId: Types.ObjectId,
) {
  const value = createHash('sha256')
    .update(`${email}:${role}:${String(departmentId)}`)
    .digest('hex')
    .slice(0, 24);
  return new Types.ObjectId(value);
}

async function ensureMembership(
  user: UserDocument,
  email: string,
  role: string,
  departmentId: Types.ObjectId,
  UserModel: mongoose.Model<User>,
) {
  const existingMembership = (user.memberships ?? []).find(
    (membership) =>
      String(membership.departmentId ?? '') === String(departmentId) &&
      membership.role === role,
  );
  const id = existingMembership
    ? new Types.ObjectId(String(existingMembership._id))
    : membershipId(user.email || email, role, departmentId);

  if (!existingMembership) {
    await UserModel.updateOne(
      {
        _id: user._id,
        memberships: {
          $not: { $elemMatch: { departmentId, role } },
        },
      },
      {
        $addToSet: {
          memberships: { _id: id, departmentId, role },
          role,
          departement: departmentId,
        },
      },
    ).exec();
  }
  await UserModel.updateOne(
    { _id: user._id, activeMembershipId: null },
    { $set: { activeMembershipId: id } },
  ).exec();
  return id;
}

function currentWeekRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

async function seedDashboardSample() {
  await mongoose.connect(
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS',
  );

  const UserModel = mongoose.model(User.name, UserSchema);
  const DepartmentModel = mongoose.model(Department.name, DepartmentSchema);
  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const ObjectiveModel = mongoose.model(Objective.name, ObjectiveSchema);
  const TaskModel = mongoose.model(Task.name, TaskSchema);

  try {
    const [executive, teamManager, responsable, member] = await Promise.all([
      EXEC_EMAIL ? UserModel.findOne({ email: EXEC_EMAIL }).exec() : null,
      TEAM_MANAGER_EMAIL
        ? UserModel.findOne({ email: TEAM_MANAGER_EMAIL }).exec()
        : null,
      UserModel.findOne({ email: RESPONSABLE_EMAIL }).exec(),
      UserModel.findOne({ email: MEMBER_EMAIL }).exec(),
    ]);
    if (EXEC_EMAIL && !executive) {
      throw new Error(`Exec account not found: ${EXEC_EMAIL}`);
    }
    if (TEAM_MANAGER_EMAIL && !teamManager) {
      throw new Error(`Team Manager account not found: ${TEAM_MANAGER_EMAIL}`);
    }
    if (!responsable) {
      throw new Error(`Responsable account not found: ${RESPONSABLE_EMAIL}`);
    }
    if (!member) throw new Error(`Member account not found: ${MEMBER_EMAIL}`);

    const hasRole = (user: User, role: string) =>
      (user.role ?? []).includes(role) ||
      (user.memberships ?? []).some((membership) => membership.role === role);
    if (executive) {
      const isExecutive =
        executive.isAdmin ||
        hasRole(executive, 'President') ||
        hasRole(executive, 'Director Executive');
      if (!isExecutive) {
        throw new Error(
          'SEED_EXEC_EMAIL must belong to a Director Executive or admin.',
        );
      }
    }
    if (teamManager && !hasRole(teamManager, 'Team Manager')) {
      throw new Error('SEED_TEAM_MANAGER_EMAIL must belong to a Team Manager.');
    }
    if (!hasRole(responsable, 'Responsable')) {
      throw new Error('SEED_RESPONSABLE_EMAIL must belong to a Responsable.');
    }
    if (!hasRole(member, 'Member')) {
      throw new Error('SEED_MEMBER_EMAIL must belong to a Member.');
    }

    const sharedDepartmentMembership =
      !EXEC_EMAIL && !TEAM_MANAGER_EMAIL
        ? (responsable.memberships ?? []).find(
            (membership) =>
              membership.role === 'Responsable' &&
              membership.departmentId != null &&
              (member.memberships ?? []).some(
                (memberMembership) =>
                  memberMembership.role === 'Member' &&
                  String(memberMembership.departmentId ?? '') ===
                    String(membership.departmentId),
              ),
          )
        : null;
    const sharedDepartmentId = sharedDepartmentMembership?.departmentId;
    const departmentUpdate: {
      $setOnInsert?: { name: string };
      $addToSet: { members: Types.ObjectId; teamManagers?: Types.ObjectId };
    } = { $addToSet: { members: member._id } };
    if (teamManager) {
      departmentUpdate.$addToSet.teamManagers = teamManager._id;
    }
    let department = sharedDepartmentId
      ? await DepartmentModel.findByIdAndUpdate(
          sharedDepartmentId,
          departmentUpdate,
          { new: true },
        ).exec()
      : await DepartmentModel.findOneAndUpdate(
          { name: 'Dashboard Sample Department' },
          {
            $setOnInsert: { name: 'Dashboard Sample Department' },
            $addToSet: {
              ...(teamManager ? { teamManagers: teamManager._id } : {}),
              members: member._id,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        ).exec();
    if (!department) throw new Error('Could not create the sample department.');

    const [, responsableMembershipId, memberMembershipId] = await Promise.all([
      teamManager
        ? ensureMembership(
            teamManager,
            teamManager.email,
            'Team Manager',
            department._id,
            UserModel,
          )
        : null,
      ensureMembership(
        responsable,
        RESPONSABLE_EMAIL,
        'Responsable',
        department._id,
        UserModel,
      ),
      ensureMembership(
        member,
        MEMBER_EMAIL,
        'Member',
        department._id,
        UserModel,
      ),
    ]);

    const [updatedResponsable, updatedMember] = await Promise.all([
      UserModel.findById(responsable._id)
        .select('activeMembershipId')
        .lean()
        .exec(),
      UserModel.findById(member._id).select('activeMembershipId').lean().exec(),
    ]);

    const now = new Date();
    const { start, end } = currentWeekRange();
    const weekKey = start.toISOString().slice(0, 10);
    const dataOwner = executive ?? responsable;
    const projectEnd = new Date(now);
    projectEnd.setUTCDate(projectEnd.getUTCDate() + 30);
    await ProjectModel.findOneAndUpdate(
      {
        title: 'Dashboard Sample Active Project',
        departmentId: department._id,
      },
      {
        $setOnInsert: {
          title: 'Dashboard Sample Active Project',
          description: 'Sample project used to verify dashboard data.',
          departmentId: department._id,
          managerIds: teamManager ? [teamManager._id] : [],
          memberIds: [member._id],
          startDate: now,
          endDate: projectEnd,
          status: 'in_progress',
          progress: 35,
          createdBy: dataOwner._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    const objective = await ObjectiveModel.findOneAndUpdate(
      {
        title: `Dashboard Sample Weekly Objective ${weekKey}`,
        departmentId: department._id,
      },
      {
        $setOnInsert: {
          title: `Dashboard Sample Weekly Objective ${weekKey}`,
          description: 'Sample objective used to verify dashboard data.',
          departmentId: department._id,
          weekStart: start,
          weekEnd: end,
          target: 10,
          achievement: 4,
          progress: 40,
          status: 'in-progress',
          createdBy: dataOwner._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    if (!objective) throw new Error('Could not create the sample objective.');

    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    await Promise.all([
      TaskModel.findOneAndUpdate(
        {
          title: `Dashboard Sample Pending Task ${weekKey}`,
          departmentId: department._id,
        },
        {
          $setOnInsert: {
            title: `Dashboard Sample Pending Task ${weekKey}`,
            description: 'Sample pending task assigned to the demo member.',
            assignedTo: member._id,
            priority: 'high',
            deadline: tomorrow,
            status: 'todo',
            objectiveId: objective._id,
            departmentId: department._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec(),
      TaskModel.findOneAndUpdate(
        {
          title: `Dashboard Sample Pending Task 2 ${weekKey}`,
          departmentId: department._id,
        },
        {
          $setOnInsert: {
            title: `Dashboard Sample Pending Task 2 ${weekKey}`,
            description:
              'Second sample pending task assigned to the demo member.',
            assignedTo: member._id,
            priority: 'medium',
            deadline: tomorrow,
            status: 'todo',
            objectiveId: objective._id,
            departmentId: department._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec(),
      TaskModel.findOneAndUpdate(
        {
          title: `Dashboard Sample Completed Task ${weekKey}`,
          departmentId: department._id,
        },
        {
          $setOnInsert: {
            title: `Dashboard Sample Completed Task ${weekKey}`,
            description: 'Sample completed task assigned to the demo member.',
            assignedTo: member._id,
            priority: 'medium',
            deadline: yesterday,
            status: 'done',
            objectiveId: objective._id,
            departmentId: department._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec(),
    ]);

    process.stdout.write(
      `Dashboard sample data ready.\nDepartment: ${String(department._id)}\nResponsable: ${String(responsable._id)}\nMember: ${String(member._id)}\nTeam Manager: ${teamManager ? String(teamManager._id) : 'not supplied'}\nExecutive: ${executive ? String(executive._id) : 'not supplied'}\n`,
    );
    if (
      String(updatedResponsable?.activeMembershipId ?? '') !==
      String(responsableMembershipId)
    ) {
      process.stdout.write(
        'The Responsable already has another active role; switch to Responsable before testing.\n',
      );
    }
    if (
      String(updatedMember?.activeMembershipId ?? '') !==
      String(memberMembershipId)
    ) {
      process.stdout.write(
        'The Member already has another active role; switch to Member before testing.\n',
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

seedDashboardSample().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Dashboard sample seed failed: ${message}\n`);
  process.exitCode = 1;
});
