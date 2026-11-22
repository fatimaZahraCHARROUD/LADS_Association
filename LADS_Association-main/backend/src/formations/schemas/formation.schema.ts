import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FormationDocument = Formation & Document;

const localizedString = {
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

@Schema({ timestamps: true })
export class Formation {
  @Prop({ type: localizedString, _id: false, required: true })
  title!: { en: string; fr: string; ar: string };

  @Prop({ type: localizedString, _id: false, required: true })
  description!: { en: string; fr: string; ar: string };

  @Prop({ default: '' })
  imgUrl!: string;

   @Prop({ default: '' })
  coverImagePublicId!: string;

  @Prop({ required: true })
  date!: string;

  @Prop({ default: '' })
  heure!: string;

  @Prop({ default: '' })
  category!: string;

  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status!: string;

  @Prop({ default: '' })
  registrationLink!: string;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;
}

export const FormationSchema = SchemaFactory.createForClass(Formation);
