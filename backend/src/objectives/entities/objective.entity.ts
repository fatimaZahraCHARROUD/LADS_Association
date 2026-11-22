import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('objectives')
export class Objective {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'week_start', type: 'date' })
  weekStart!: Date;

  @Column({ name: 'week_end', type: 'date' })
  weekEnd!: Date;

  @Column({ type: 'int', default: 0 })
  target!: number;

  @Column({ type: 'int', default: 0 })
  achievement!: number;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'in-progress', 'completed'],
    default: 'in-progress',
  })
  status!: string;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @Column({ name: 'created_by' })
  createdBy!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
