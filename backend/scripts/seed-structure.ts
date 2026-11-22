import 'dotenv/config';
import mongoose from 'mongoose';

const URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS';

const departments = [
  { name: 'Communication', description: 'Réseaux sociaux, design et visibilité' },
  { name: 'Événementiel', description: 'Organisation des événements' },
  { name: 'Formation', description: 'Cours, workshops et mentorat' },
  { name: 'Technique', description: 'Projets techniques et développement' },
  { name: 'Logistique', description: 'Matériel et support des activités' },
];

const roles = [
  { name: 'President', permissions: ['all'] },
  { name: 'Manager', permissions: ['manage', 'read'] },
  { name: 'Responsible', permissions: ['create', 'read'] },
  { name: 'Member', permissions: ['read'] },
];

async function run() {
  await mongoose.connect(URI);
  const db = mongoose.connection.getClient().db();

  await db.createCollection('department_members');

  for (const d of departments) {
    await db.collection('departments').updateOne(
      { name: d.name },
      { $setOnInsert: { ...d, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true },
    );
  }

  for (const r of roles) {
    await db.collection('roles').updateOne(
      { name: r.name },
      { $setOnInsert: { ...r, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true },
    );
  }

  const cols = (await db.listCollections().toArray()).map((c) => c.name);
  console.log('Collections présentes :', cols.filter((c) => c !== 'system.indexes').join(', '));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});