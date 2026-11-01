import 'dotenv/config';
import mongoose from 'mongoose';
import { HashService } from '../src/services/hash.service';
import { User, UserSchema } from '../src/users/schemas/user.schema';

function requiredValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before running this script.`);
  return value;
}

async function main() {
  const email = requiredValue('TEST_USER_EMAIL').toLowerCase();
  const fullName = requiredValue('TEST_USER_FULL_NAME');
  const password = requiredValue('TEST_USER_PASSWORD');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('TEST_USER_EMAIL must be a valid email address.');
  }

  await mongoose.connect(
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS',
  );

  try {
    const UserModel = mongoose.model(User.name, UserSchema);
    const existing = await UserModel.findOne({ email }).exec();
    if (existing) {
      if (existing.isAdmin) {
        throw new Error(`Refusing to use existing admin account ${email}.`);
      }
      if (existing.status !== 'active') {
        throw new Error(`Existing account ${email} is not active.`);
      }
      const passwordMatches = await new HashService().compare(
        password,
        existing.password,
      );
      if (!passwordMatches) {
        throw new Error(
          `Account ${email} already exists with a different password; no changes made.`,
        );
      }

      console.log(`Existing test user is ready. Email: ${email}`);
      console.log(`Password: ${password}`);
      return;
    }

    const hashedPassword = await new HashService().hash(password);
    const user = await UserModel.create({
      email,
      fullName,
      password: hashedPassword,
      isAdmin: false,
      status: 'active',
    });

    if (user.isAdmin || user.status !== 'active') {
      throw new Error(
        `Created user ${email} did not receive expected defaults.`,
      );
    }

    console.log(`Created active non-admin test user. Email: ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    `Could not create test user: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
