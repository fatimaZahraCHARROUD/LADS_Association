import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ─── Inline entity definitions (avoid importing app modules) ─────────────────

import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne,
  JoinColumn, AfterLoad,
} from 'typeorm';

@Entity('users')
class User {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'membership_number', default: '' }) membershipNumber!: string;
  @Column({ name: 'full_name' }) fullName!: string;
  @Column({ unique: true }) email!: string;
  @Column({ select: false }) password!: string;
  @Column({ type: 'enum', enum: ['Male', 'Female'] }) genre!: string;
  @Column({ type: 'json' }) role!: string[];
  @OneToMany(() => Membership, (m) => m.user, { cascade: true })
  memberships!: Membership[];
  @Column({ name: 'active_membership_id', nullable: true, type: 'int' }) activeMembershipId!: number | null;
  @Column({ type: 'json', default: '[]' }) departement!: number[];
  @Column({ name: 'is_admin', default: false }) isAdmin!: boolean;
  @Column({ nullable: true }) phone!: string;
  @Column({ nullable: true }) birthday!: string;
  @Column({ nullable: true }) ville!: string;
  @Column({ name: 'niveau_etude', nullable: true }) niveau_etude!: string;
  @Column({ name: 'specialite_etude', nullable: true }) specialite_etude!: string;
  @Column({ nullable: true }) situation!: string;
  @Column({ name: 'date_adhesion', nullable: true }) date_adhesion!: string;
  @Column({ name: 'cotisation_payee', default: false }) cotisation_payee!: boolean;
  @Column({ name: 'profile_image', nullable: true }) profileImage!: string;
}

@Entity('memberships')
class Membership {
  @PrimaryGeneratedColumn() id!: number;
  _id!: string;
  @AfterLoad() setVirtualId() { this._id = String(this.id); }
  @Column({ name: 'user_id' }) userId!: number;
  @ManyToOne(() => User, (u) => u.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user!: User;
  @Column({ name: 'department_id', nullable: true, type: 'int' }) departmentId!: number | null;
  @Column({
    type: 'enum',
    enum: ['President', 'Director Executive', 'Team Manager', 'Responsable', 'Member'],
  })
  role!: string;
}

// ─── DataSource ───────────────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'lads_db',
  entities: [User, Membership],
  synchronize: true,
});

// ─── Seed data ────────────────────────────────────────────────────────────────

interface SeedAccount {
  fullName: string;
  email: string;
  password: string;
  genre: 'Male' | 'Female';
  role: string;
  isAdmin: boolean;
  phone?: string;
  ville?: string;
}

const ACCOUNTS: SeedAccount[] = [
  {
    fullName: 'Admin LADS',
    email: 'admin@lads.org',
    password: 'admin123',
    genre: 'Male',
    role: 'President',
    isAdmin: true,
    phone: '+212600000000',
    ville: 'Casablanca',
  },
  {
    fullName: 'Directeur Exécutif',
    email: 'exec@lads.org',
    password: 'password123',
    genre: 'Male',
    role: 'Director Executive',
    isAdmin: false,
    phone: '+212600000001',
    ville: 'Rabat',
  },
  {
    fullName: 'Team Manager',
    email: 'teammanager@lads.org',
    password: 'password123',
    genre: 'Female',
    role: 'Team Manager',
    isAdmin: false,
    phone: '+212600000002',
    ville: 'Marrakech',
  },
  {
    fullName: 'Responsable',
    email: 'responsable@lads.org',
    password: 'password123',
    genre: 'Male',
    role: 'Responsable',
    isAdmin: false,
    phone: '+212600000003',
    ville: 'Fes',
  },
  {
    fullName: 'Membre',
    email: 'member@lads.org',
    password: 'password123',
    genre: 'Female',
    role: 'Member',
    isAdmin: false,
    phone: '+212600000004',
    ville: 'Tangier',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MySQL...');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  const userRepo = AppDataSource.getRepository(User);
  const membershipRepo = AppDataSource.getRepository(Membership);

  for (const account of ACCOUNTS) {
    const existing = await userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email: account.email })
      .getOne();

    if (existing) {
      console.log(`  ⚠  ${account.email} already exists — skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    const count = await userRepo.count();
    const membershipNumber = `MEM-${String(count + 1).padStart(4, '0')}`;

    const user = userRepo.create({
      fullName: account.fullName,
      email: account.email,
      password: hashedPassword,
      genre: account.genre,
      role: [account.role],
      isAdmin: account.isAdmin,
      phone: account.phone,
      ville: account.ville,
      membershipNumber,
      departement: [],
      date_adhesion: new Date().toISOString().slice(0, 10),
      cotisation_payee: account.isAdmin,
    });

    const savedUser = await userRepo.save(user);

    const membership = membershipRepo.create({
      userId: savedUser.id,
      role: account.role as Membership['role'],
      departmentId: null,
    });
    const savedMembership = await membershipRepo.save(membership);

    savedUser.activeMembershipId = savedMembership.id;
    await userRepo.save(savedUser);

    console.log(`  ✅  ${account.email} created (id=${savedUser.id}, membership=${savedMembership.id}, role=${account.role})`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Seed complete. Credentials:');
  console.log('');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.padEnd(20)} ${a.email} / ${a.password}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
