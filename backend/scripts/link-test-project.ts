import 'dotenv/config';
import mongoose from 'mongoose';

const RESP_EMAIL = 'resp.test@lads.test';
const MEMBER_EMAILS = [
  'ahmed.test@lads.test',
  'sara.test@lads.test',
  'imane.test@lads.test',
];

async function main() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS';
  // sécurité : on refuse de toucher une base qui n'est pas locale
  if (!/localhost|127\.0\.0\.1/.test(uri)) {
    throw new Error('Refusing to run: the database is not local.');
  }

  await mongoose.connect(uri);

  try {
    const users = mongoose.connection.collection('users');
    const projects = mongoose.connection.collection('projects');

    const sameName = await users.countDocuments({ fullName: 'Resp Test' });
    console.log(`Accounts named "Resp Test": ${sameName}`);

    const resp = await users.findOne({ email: RESP_EMAIL });
    if (!resp) throw new Error(`User not found: ${RESP_EMAIL}`);

    const members: any[] = [];
    for (const email of MEMBER_EMAILS) {
      const u = await users.findOne({ email });
      if (!u) throw new Error(`User not found: ${email}`);
      members.push(u);
    }

    const count = await projects.countDocuments({ title: 'RIWAQ' });
    if (count !== 1) throw new Error(`Expected exactly 1 project "RIWAQ", found ${count}.`);
    const project = await projects.findOne({ title: 'RIWAQ' });
    if (!project) throw new Error('Project RIWAQ not found.');

    const show = (ids: any[] | undefined) =>
      JSON.stringify((ids ?? []).map((x: any) => `${typeof x === 'string' ? 'STRING' : 'ObjectId'}:${String(x)}`));

    console.log('BEFORE managerIds =', show(project.managerIds));
    console.log('BEFORE memberIds  =', show(project.memberIds));
    console.log('Resp id =', String(resp._id));

    await projects.updateOne(
      { _id: project._id },
      { $set: { managerIds: [resp._id], memberIds: members.map((m) => m._id) } },
    );

    const after = await projects.findOne({ _id: project._id });
    console.log('AFTER  managerIds =', show(after?.managerIds));
    console.log('AFTER  memberIds  =', show(after?.memberIds));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Could not link project: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});