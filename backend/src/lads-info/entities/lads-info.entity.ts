import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('lads_info')
export class LadsInfo {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ type: 'json' })
  title!: { en: string; fr: string; ar: string };

  @Column({ type: 'json' })
  content!: { en: string; fr: string; ar: string };

  @Column({ name: 'updated_by', nullable: true, type: 'int' })
  updatedBy!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
