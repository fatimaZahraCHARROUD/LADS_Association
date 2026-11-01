import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactMessageDocument = ContactMessage & Document;

@Schema({ timestamps: true })
export class ContactMessage {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  subject!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;
}

export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);
