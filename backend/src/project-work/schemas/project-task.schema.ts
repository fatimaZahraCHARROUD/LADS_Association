import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectTaskDocument = HydratedDocument<ProjectTask>;
export const TASK_STATUSES = ['todo', 'in_progress', 'completed'] as const;

@Schema({ timestamps: true, collection: 'project_tasks' })
export class ProjectTask {
  @Prop({ type: Types.ObjectId, ref: 'ProjectCell', required: true, index: true })
  cell!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  assignedTo!: Types.ObjectId;

  @Prop({ enum: TASK_STATUSES, default: 'todo' })
  status!: string;

  @Prop()
  dueDate?: Date;
}
export const ProjectTaskSchema = SchemaFactory.createForClass(ProjectTask);