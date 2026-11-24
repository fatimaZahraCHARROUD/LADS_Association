import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('documents')
export class LadsDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  title!: string;

  @Column({ default: '' })
  category!: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy!: number;

  @Column({ name: 'drive_url' })
  driveUrl!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({
    type: 'enum',
    enum: ['all', 'private', 'department', 'member'],
    default: 'all',
  })
  visibility!: string;

  @Column({ name: 'visibility_department', nullable: true, type: 'int' })
  visibilityDepartment!: number | null;

  @Column({ name: 'visibility_member', nullable: true, type: 'int' })
  visibilityMember!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
