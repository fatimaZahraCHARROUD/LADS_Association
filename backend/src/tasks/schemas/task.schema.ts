import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type TaskDocument = Task & Document;

// Collection "tasks" : le tableau des tâches (Task Board)
@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  assignedTo!: Types.ObjectId;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority!: string;

  @Prop({ type: Date, default: null })
  deadline!: Date | null;

  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Objective', default: null })
  objectiveId!: Types.ObjectId | null;

  // 👇 NEW: the department this task belongs to.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);