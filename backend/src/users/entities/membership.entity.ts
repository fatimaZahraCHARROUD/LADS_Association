import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, AfterLoad,
} from 'typeorm';
import { User } from './user.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @Column({
    type: 'enum',
    enum: ['President', 'Director Executive', 'Team Manager', 'Responsable', 'Member'],
  })
  role!: string;
}
