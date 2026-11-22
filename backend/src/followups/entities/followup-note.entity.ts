import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('followup_notes')
export class FollowupNote {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  author!: number;

  @Column({ name: 'author_name' })
  authorName!: string;

  @Column({ name: 'author_role' })
  authorRole!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({
    name: 'note_type',
    type: 'enum',
    enum: ['info', 'warning', 'action'],
    default: 'info',
  })
  noteType!: string;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @Column({ name: 'member_id', nullable: true, type: 'int' })
  memberId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
