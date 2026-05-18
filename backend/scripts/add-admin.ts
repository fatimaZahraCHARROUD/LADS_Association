import 'dotenv/config';
import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS';

const UserSchema = new Schema(
  {
    fullName: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: [String],
    genre: String,
    profileImage: String,
    phone: String,
    birthday: String,
    ville: String,
    niveau_etude: String,
    specialite_etude: String,
    situation: String,
    departement: [String],
    date_adhesion: String,
    cotisation_payee: Boolean,
  },
  { timestamps: true, collection: 'users' },
);

const User = mongoose.model('User', UserSchema);

async function run() {
  const email = 'admin@lads.ma';
  const plain = 'admin123';

  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User ${email} already exists (id: ${existing._id}). Updating password and role.`);
    existing.set('password', await bcrypt.hash(plain, 10));
    existing.set('role', ['President']);
    await existing.save();
  } else {
    await User.create({
      fullName: 'Admin LADS',
      email,
      password: await bcrypt.hash(plain, 10),
      role: ['President'],
      genre: 'Male',
      phone: '+212600000000',
      ville: 'Casablanca',
      niveau_etude: 'Master',
      specialite_etude: 'Management',
      situation: 'Active',
      departement: ['Communication'],
      date_adhesion: new Date().toISOString().slice(0, 10),
      cotisation_payee: true,
    });
    console.log(`Created user ${email}.`);
  }

  console.log(`Login: ${email} / ${plain}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
