import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export type LadsDocumentDocument = LadsDocument & MongooseDocument;

@Schema({ timestamps: true })
export class LadsDocument {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  category!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;

  @Prop({ required: true })
  driveUrl!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({
    enum: ['all', 'private', 'department', 'member'],
    default: 'all',
  })
  visibility!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  visibilityDepartment!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  visibilityMember!: Types.ObjectId | null;
}

export const DocumentSchema = SchemaFactory.createForClass(LadsDocument);
