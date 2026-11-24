import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('department_members')
export class DepartmentMember {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ name: 'user_id' })
  user!: number;

  @Column({ name: 'department_id' })
  department!: number;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
