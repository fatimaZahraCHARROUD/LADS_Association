import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'json', default: () => "('[]')" })
  permissions!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
