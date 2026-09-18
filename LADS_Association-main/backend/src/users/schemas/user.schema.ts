import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: [String], enum: ['President', 'Manager', 'Responsible', 'Member'], default: ['Member'] })
  role!: string[];

  @Prop({ enum: ['Male', 'Female'], default: 'Male' })
  genre!: string;

  @Prop({ default: '' })
  profileImage!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  birthday!: string;

  @Prop({ default: '' })
  ville!: string;

  @Prop({ default: '' })
  niveau_etude!: string;

  @Prop({ default: '' })
  specialite_etude!: string;

  @Prop({ default: '' })
  situation!: string;

  @Prop({ type: [String], default: [] })
  departement!: string[];

  @Prop({ default: '' })
  date_adhesion!: string;

  @Prop({ default: false })
  cotisation_payee!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
