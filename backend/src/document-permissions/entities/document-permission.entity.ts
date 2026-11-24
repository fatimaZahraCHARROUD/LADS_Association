import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, AfterLoad,
} from 'typeorm';

@Entity('document_permissions')
export class DocumentPermission {
  @PrimaryGeneratedColumn()
  id!: number;

  _id!: string;
  @AfterLoad()
  setVirtualId() { this._id = String(this.id); }

  @Column({ name: 'document_id' })
  document!: number;

  @Column({ name: 'permission_type', type: 'enum', enum: ['department', 'user'] })
  permissionType!: string;

  @Column({ name: 'department_id', nullable: true, type: 'int' })
  department!: number | null;

  @Column({ name: 'user_id', nullable: true, type: 'int' })
  user!: number | null;

  @Column({ name: 'can_view', default: true })
  canView!: boolean;

  @Column({ name: 'can_delete', default: false })
  canDelete!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
