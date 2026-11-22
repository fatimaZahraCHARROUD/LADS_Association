import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ type: 'json' })
  title!: { en: string; fr: string; ar: string };

  @Column({ type: 'json' })
  description!: { en: string; fr: string; ar: string };

  @Column({ type: 'json', nullable: true })
  category!: { en: string; fr: string; ar: string } | null;

  @Column()
  date!: string;

  @Column({ default: '' })
  time!: string;

  @Column({ default: '' })
  location!: string;

  @Column({ name: 'max_participants', default: 0 })
  maxParticipants!: number;

  @Column({ name: 'cover_image', default: '' })
  coverImage!: string;

  @Column({ name: 'cover_image_public_id', default: '' })
  coverImagePublicId!: string;

  @Column({ name: 'register_link', default: '' })
  registerLink!: string;

  @Column({ type: 'enum', enum: ['upcoming', 'past'], default: 'upcoming' })
  status!: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by', nullable: true, type: 'int' })
  createdBy!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
