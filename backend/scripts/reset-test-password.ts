import 'dotenv/config';
import mongoose from 'mongoose';
import { HashService } from '../src/services/hash.service';
import { User, UserSchema } from '../src/users/schemas/user.schema';

async function main() {
  const email = process.env.TARGET_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.NEW_PASSWORD?.trim();
  if (!email || !newPassword) {
    throw new Error('Set TARGET_EMAIL and NEW_PASSWORD before running this script.');
  }

  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS';
  // sécurité : on refuse de toucher une base qui n'est pas locale
  if (!/localhost|127\.0\.0\.1/.test(uri)) {
    throw new Error('Refusing to run: the database is not local.');
  }

  await mongoose.connect(uri);

  try {
    const UserModel = mongoose.model(User.name, UserSchema);

    // lean() lit le document brut, sans conversion de types : les anciennes
    // données (departement en texte) ne bloquent donc pas
    const user: any = await UserModel.findOne({ email }).lean().exec();
    if (!user) throw new Error(`No account found for ${email}.`);

    const hashed = await new HashService().hash(newPassword);

    // updateOne avec $set ne touche et ne valide que le champ password
    const result = await UserModel.updateOne(
      { _id: user._id },
      { $set: { password: hashed } },
    ).exec();

    if (result.matchedCount !== 1) throw new Error('Password was not updated.');

    console.log(`Password reset for ${email}`);
    console.log(
      `isAdmin=${String(user.isAdmin)} | status=${String(user.status)} | role=${JSON.stringify(user.role)} | memberships=${JSON.stringify((user.memberships ?? []).map((m: any) => m.role))}`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    `Could not reset password: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});