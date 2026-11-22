import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('cellules')
export class Cellule {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ name: 'department_id' })
  departmentId!: number;

  @Column({ name: 'manager_id' })
  managerId!: number;

  @Column({ type: 'json', default: () => "('[]')" })
  members!: number[];

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
