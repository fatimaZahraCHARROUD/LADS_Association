import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type MeetingDocument = Meeting & Document;

@Schema({ timestamps: true })
export class Meeting {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  department!: Types.ObjectId | null;

  @Prop({ required: true })
  startAt!: Date;

  @Prop({ required: true })
  endAt!: Date;

  @Prop({ default: '' })
  meetingLink!: string;

  @Prop({
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status!: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'User', default: [] })
  participants!: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  // Département concerné par la réunion
  // (utile pour limiter le Team Manager à SES départements)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
