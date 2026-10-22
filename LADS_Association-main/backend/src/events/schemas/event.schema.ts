import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

const localizedString = {
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: localizedString, _id: false, required: true })
  title!: { en: string; fr: string; ar: string };

  @Prop({ type: localizedString, _id: false, required: true })
  description!: { en: string; fr: string; ar: string };

  @Prop({  type: localizedString ,_id: false,required: true,  default: {
    en: '',
    fr: '',
    ar: '',
  }, })
  category!: { en: string; fr: string; ar: string };

  @Prop({ required: true })
  date!: string;

  @Prop({ default: '' })
  time!: string;

  @Prop({ default: '' })
  location!: string;

  @Prop({ default: 0 })
  maxParticipants!: number;

  @Prop({ default: '' })
  coverImage!: string;

   @Prop({ default: '' })
  coverImagePublicId!: string;
  
  @Prop({ default: '' })
  registerLink!: string;

  @Prop({ enum: ['upcoming', 'past'], default: 'upcoming' })
  status!: string;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
