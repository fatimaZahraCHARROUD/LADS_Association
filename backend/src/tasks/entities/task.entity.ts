import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'assigned_to' })
  assignedTo!: number;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority!: string;

  @Column({ type: 'date', nullable: true })
  deadline!: Date | null;

  @Column({
    type: 'enum',
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  })
  status!: string;

  @Column({ name: 'objective_id', nullable: true, type: 'int' })
  objectiveId!: number | null;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
