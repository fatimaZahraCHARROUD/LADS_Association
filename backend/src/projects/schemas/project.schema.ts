import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

export const PROJECT_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
] as const;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ default: '' })
  img!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  managerIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  memberIds!: Types.ObjectId[];

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ enum: PROJECT_STATUSES, default: 'planned' })
  status!: string;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  progress!: number;

  @Prop({ default: '' })
  driveUrl!: string;

  @Prop({ default: false })
  isPublished!: boolean;
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);