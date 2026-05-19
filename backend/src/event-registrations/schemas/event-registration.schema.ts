import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventRegistrationDocument = EventRegistration & Document;

@Schema({ timestamps: true })
export class EventRegistration {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ type: Date, default: Date.now })
  registrationDate: Date;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const EventRegistrationSchema = SchemaFactory.createForClass(EventRegistration);
