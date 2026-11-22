import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

const localizedString = {
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: localizedString, _id: false, required: true })
  title!: { en: string; fr: string; ar: string };

  @Prop({ type: localizedString, _id: false, required: true })
  description!: { en: string; fr: string; ar: string };

  @Prop({ required: true })
  activityDate!: string;

  @Prop({ default: '' })
  location!: string;

  @Prop({ default: '' })
  image!: string;

  @Prop({ default: '' })
  coverImagePublicId!: string;

  @Prop({ default: '' })
  categorie!: string;

  @Prop({ enum: ['upcoming', 'completed'], default: 'upcoming' })
  status!: string;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  memberId!: Types.ObjectId | null;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
