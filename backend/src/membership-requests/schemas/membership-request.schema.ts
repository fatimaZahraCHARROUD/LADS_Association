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
}

export const MembershipRequestSchema = SchemaFactory.createForClass(MembershipRequest);
