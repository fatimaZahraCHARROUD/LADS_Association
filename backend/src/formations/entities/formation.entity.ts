import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('formations')
export class Formation {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ type: 'json' })
  title!: { en: string; fr: string; ar: string };

  @Column({ type: 'json' })
  description!: { en: string; fr: string; ar: string };

  @Column({ name: 'img_url', default: '' })
  imgUrl!: string;

  @Column({ name: 'cover_image_public_id', default: '' })
  coverImagePublicId!: string;

  @Column()
  date!: string;

  @Column({ default: '' })
  heure!: string;

  @Column({ default: '' })
  category!: string;

  @Column({ type: 'enum', enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status!: string;

  @Column({ name: 'registration_link', default: '' })
  registrationLink!: string;

  @Column({ name: 'drive_url', default: '' })
  driveUrl!: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by', nullable: true, type: 'int' })
  createdBy!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
