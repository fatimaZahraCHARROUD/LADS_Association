import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('strategic_plans')
export class StrategicPlan {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  title!: string;

  @Column({ type: 'text' })
  objective!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'date' })
  deadline!: Date;

  @Column({
    type: 'enum',
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
  })
  status!: string;

  @Column({ name: 'created_by' })
  createdBy!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
