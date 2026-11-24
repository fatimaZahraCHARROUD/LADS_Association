import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ type: 'json' })
  title!: { en: string; fr: string; ar: string };

  @Column({ type: 'json' })
  description!: { en: string; fr: string; ar: string };

  @Column({ name: 'activity_date' })
  activityDate!: string;

  @Column({ default: '' })
  location!: string;

  @Column({ default: '' })
  image!: string;

  @Column({ name: 'cover_image_public_id', default: '' })
  coverImagePublicId!: string;

  @Column({ default: '' })
  categorie!: string;

  @Column({ type: 'enum', enum: ['upcoming', 'completed'], default: 'upcoming' })
  status!: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by', nullable: true, type: 'int' })
  createdBy!: number | null;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  departmentId!: number | null;

  @Column({ name: 'member_id', nullable: true, type: 'int' })
  memberId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
