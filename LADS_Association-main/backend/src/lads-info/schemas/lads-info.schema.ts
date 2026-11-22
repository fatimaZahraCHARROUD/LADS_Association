import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LadsInfoDocument = LadsInfo & Document;

const localizedString = {
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

@Schema({ timestamps: true })
export class LadsInfo {
  @Prop({ type: localizedString, _id: false, required: true })
  title!: { en: string; fr: string; ar: string };

  @Prop({ type: localizedString, _id: false, required: true })
  content!: { en: string; fr: string; ar: string };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy!: Types.ObjectId;
}

export const LadsInfoSchema = SchemaFactory.createForClass(LadsInfo);
