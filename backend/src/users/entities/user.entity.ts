import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';
import { Membership } from './membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ default: '' })
  membershipNumber!: string;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: 'enum', enum: ['Male', 'Female'], default: 'Male' })
  genre!: string;

  @Column({ type: 'json', default: () => "('[]')" })
  role!: string[];

  @OneToMany(() => Membership, (m) => m.user, { cascade: true, eager: false })
  memberships!: Membership[];

  @Column({ name: 'active_membership_id', nullable: true, type: 'int' })
  activeMembershipId!: number | null;

  @Column({ type: 'json', default: () => "('[]')" })
  departement!: number[];

  @Column({ default: '' })
  profileImage!: string;

  @Column({ default: '' })
  phone!: string;

  @Column({ default: '' })
  birthday!: string;

  @Column({ default: '' })
  ville!: string;

  @Column({ name: 'niveau_etude', default: '' })
  niveau_etude!: string;

  @Column({ name: 'specialite_etude', default: '' })
  specialite_etude!: string;

  @Column({ default: '' })
  situation!: string;

  @Column({ name: 'date_adhesion', default: '' })
  date_adhesion!: string;

  @Column({ name: 'cotisation_payee', default: false })
  cotisation_payee!: boolean;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status!: string;

  @Column({ name: 'is_admin', default: false })
  isAdmin!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
