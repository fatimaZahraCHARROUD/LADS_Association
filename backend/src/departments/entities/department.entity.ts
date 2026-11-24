import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'int' })
  manager!: number | null;

  @Column({ name: 'vice_manager', nullable: true, type: 'int' })
  viceManager!: number | null;

  @Column({ name: 'team_managers', type: 'json', default: () => "('[]')" })
  teamManagers!: number[];

  @Column({ type: 'json', default: () => "('[]')" })
  members!: number[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
