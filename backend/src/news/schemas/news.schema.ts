import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewsDocument = News & Document;

const localizedString = {
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

@Schema({ timestamps: true })
export class News {
  @Prop({ type: localizedString, _id: false, required: true })
  title: { en: string; fr: string; ar: string };

  @Prop({ type: localizedString, _id: false, required: true })
  content: { en: string; fr: string; ar: string };

  @Prop({ default: '' })
  thumbnail: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ type: Date })
  publishedAt: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
