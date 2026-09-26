import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type DepartmentMemberDocument = DepartmentMember & Document;

@Schema({ timestamps: true, collection: 'department_members' })
export class DepartmentMember {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', required: true })
  department!: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status!: string;
}

export const DepartmentMemberSchema = SchemaFactory.createForClass(DepartmentMember);