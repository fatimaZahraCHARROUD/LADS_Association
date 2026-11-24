import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ nullable: true, type: 'int' })
  department!: number | null;

  @Column({ name: 'start_at', type: 'datetime' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'datetime' })
  endAt!: Date;

  @Column({ name: 'meeting_link', default: '' })
  meetingLink!: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status!: string;

  @Column({ type: 'json', default: () => "('[]')" })
  participants!: number[];

  @Column({ name: 'created_by' })
  createdBy!: number;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
