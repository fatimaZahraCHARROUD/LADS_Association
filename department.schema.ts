import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  manager?: Types.ObjectId | string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  viceManager?: Types.ObjectId | string | null;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  teamManagers!: Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  members!: Types.ObjectId[];
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
