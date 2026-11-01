import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import {
  Department,
  DepartmentSchema,
} from '../src/departments/schemas/department.schema';
import { User, UserSchema } from '../src/users/schemas/user.schema';

type TestRole = 'Responsable' | 'Member';

function requiredEmail(name: string) {
  const email = process.env[name]?.trim().toLowerCase();
  if (!email)
    throw new Error(`Set ${name} to an existing non-admin account email.`);
  return email;
}

async function main() {
  const responsableEmail = requiredEmail('ROLE_RESPONSABLE_EMAIL');
  const memberEmail = requiredEmail('ROLE_MEMBER_EMAIL');
  if (responsableEmail === memberEmail) {
    throw new Error(
      'ROLE_RESPONSABLE_EMAIL and ROLE_MEMBER_EMAIL must be different users.',
    );
  }

  await mongoose.connect(
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS',
  );

  try {
    const UserModel = mongoose.model(User.name, UserSchema);
    const DepartmentModel = mongoose.model(Department.name, DepartmentSchema);
    const responsable = await UserModel.findOne({
      email: responsableEmail,
    }).exec();
    if (!responsable) {
      throw new Error(`User not found for ${responsableEmail}.`);
    }
    if (responsable.isAdmin) {
      throw new Error(`Refusing to change admin account ${responsableEmail}.`);
    }

    const member = await UserModel.findOne({ email: memberEmail }).exec();
    if (!member) throw new Error(`User not found for ${memberEmail}.`);
    if (member.isAdmin) {
      throw new Error(`Refusing to change admin account ${memberEmail}.`);
    }

    let department: { _id: Types.ObjectId } | null;

    if (process.env.DEPARTMENT_ID?.trim()) {
      const departmentId = process.env.DEPARTMENT_ID.trim();
      if (!mongoose.isValidObjectId(departmentId)) {
        throw new Error('DEPARTMENT_ID must be a valid MongoDB ObjectId.');
      }
      department = await DepartmentModel.findById(departmentId)
        .select('_id')
        .lean()
        .exec();
      if (!department) {
        throw new Error(
          `Department not found for DEPARTMENT_ID: ${departmentId}`,
        );
      }
    } else {
      department = await DepartmentModel.findOne({})
        .sort({ _id: 1 })
        .select('_id')
        .lean()
        .exec();
      if (!department) {
        department = await DepartmentModel.create({ name: 'Test Department' });
        console.log(`Created Test Department (${department._id}).`);
      }
    }

    const departmentId = department._id;

    async function setUserRole(
      user: NonNullable<typeof responsable>,
      email: string,
      role: TestRole,
    ) {
      const existingMembership = (user.memberships ?? []).find(
        (membership) =>
          membership.role === role &&
          String(membership.departmentId ?? '') === String(departmentId),
      );
      const membershipId = existingMembership?._id ?? new Types.ObjectId();
      const previouslyActive =
        String(user.activeMembershipId ?? '') === String(membershipId);

      const update: {
        $set: { activeMembershipId: Types.ObjectId };
        $addToSet: {
          role: string;
          departement: Types.ObjectId;
          memberships?: {
            _id: Types.ObjectId;
            role: TestRole;
            departmentId: Types.ObjectId;
          };
        };
      } = {
        $set: { activeMembershipId: membershipId },
        $addToSet: {
          role,
          departement: departmentId,
        },
      };

      if (!existingMembership) {
        update.$addToSet.memberships = {
          _id: membershipId,
          role,
          departmentId,
        };
      }

      const result = await UserModel.updateOne(
        { _id: user._id, isAdmin: { $ne: true } },
        update,
      ).exec();
      if (result.matchedCount !== 1) {
        throw new Error(
          `User ${email} was not updated; it may now be an admin.`,
        );
      }

      console.log(
        `${email}: ${existingMembership ? 'reused' : 'added'} ${role} membership ` +
          `for department ${departmentId}; activeMembershipId ` +
          `${previouslyActive ? 'already selected' : 'set'} to ${membershipId}.`,
      );
    }

    await setUserRole(responsable, responsableEmail, 'Responsable');
    await setUserRole(member, memberEmail, 'Member');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    `Could not set test roles: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
