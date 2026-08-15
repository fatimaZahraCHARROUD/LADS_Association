import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentPermissionDocument = DocumentPermission & Document;

@Schema({ timestamps: true })
export class DocumentPermission {
  @Prop({ type: Types.ObjectId, ref: 'LadsDocument', required: true })
  document!: Types.ObjectId;

  @Prop({ enum: ['department', 'user'], required: true })
  permissionType!: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  department!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user!: Types.ObjectId | null;

  @Prop({ default: true })
  canView!: boolean;

  @Prop({ default: false })
  canDelete!: boolean;
}

export const DocumentPermissionSchema =
  SchemaFactory.createForClass(DocumentPermission);
