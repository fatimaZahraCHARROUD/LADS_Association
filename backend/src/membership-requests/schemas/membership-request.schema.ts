import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MembershipRequestDocument = MembershipRequest & Document;

@Schema({ timestamps: true })
export class MembershipRequest {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  motivation: string;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const MembershipRequestSchema = SchemaFactory.createForClass(MembershipRequest);
