import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ type: 'json' })
  title!: { en: string; fr: string; ar: string };

  @Column({ type: 'json' })
  content!: { en: string; fr: string; ar: string };

  @Column({ default: '' })
  thumbnail!: string;

  @Column({ name: 'cover_image_public_id', default: '' })
  coverImagePublicId!: string;

  @Column({ type: 'json', default: () => "('[]')" })
  tags!: string[];

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'author_id', nullable: true, type: 'int' })
  authorId!: number | null;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
