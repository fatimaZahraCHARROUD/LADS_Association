import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Column({ default: '' })
  phone!: string;

  @Column({ name: 'registration_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  registrationDate!: Date;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
