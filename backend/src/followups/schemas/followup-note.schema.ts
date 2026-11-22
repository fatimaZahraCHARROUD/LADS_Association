import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowupNoteDocument = FollowupNote & Document;

@Schema({ timestamps: true })
export class FollowupNote {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  authorName!: string;

  @Prop({ required: true, trim: true })
  authorRole!: string;

  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({ enum: ['info', 'warning', 'action'], default: 'info' })
  noteType!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  memberId!: Types.ObjectId | null;
}

export const FollowupNoteSchema = SchemaFactory.createForClass(FollowupNote);
