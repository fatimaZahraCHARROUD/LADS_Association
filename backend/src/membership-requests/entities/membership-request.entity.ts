import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('membership_requests')
export class MembershipRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Column({ default: '' })
  phone!: string;

  @Column({ default: '' })
  city!: string;

  @Column({ type: 'text', default: '' })
  motivation!: string;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
