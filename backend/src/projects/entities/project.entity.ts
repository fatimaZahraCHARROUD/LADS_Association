import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ default: '' })
  img!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @Column({ name: 'manager_ids', type: 'json', default: () => "('[]')" })
  managerIds!: number[];

  @Column({ name: 'member_ids', type: 'json', default: () => "('[]')" })
  memberIds!: number[];

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: ['planned', 'in_progress', 'completed', 'on_hold'],
    default: 'planned',
  })
  status!: string;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'drive_url', default: '' })
  driveUrl!: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by' })
  createdBy!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
