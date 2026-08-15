import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export type LadsDocumentDocument = LadsDocument & MongooseDocument;

@Schema({ timestamps: true })
export class LadsDocument {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  category!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;

  @Prop({ required: true })
  driveUrl!: string;

  @Prop({ default: '' })
  description!: string;
}

export const DocumentSchema = SchemaFactory.createForClass(LadsDocument);
