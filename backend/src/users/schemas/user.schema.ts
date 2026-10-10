import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ _id: true, timestamps: false })
export class Membership {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    enum: [
      'President',
      'Director Executive',
      'Team Manager',
      'Responsable',
      'Member',
    ],
  })
  role!: string;
}
export const MembershipSchema = SchemaFactory.createForClass(Membership);

@Schema({ timestamps: true })
export class User {
  @Prop({ default: '' })
  membershipNumber!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;


  @Prop({
    type: [String],
    enum: [
      'President',
      'Manager',
      'Responsible',
      'Member',
      'Director Executive',
      'Team Manager',
      'Responsable',
    ],
    default: ['Member'],
  })
  role!: string[];

  @Prop({ enum: ['Male', 'Female'], default: 'Male' })
  genre!: string;

  @Prop({ type: [MembershipSchema], default: [] })
  memberships!: Membership[];

  @Prop({ type: Types.ObjectId, default: null })
  activeMembershipId!: Types.ObjectId | null;

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

  @Prop({ default: '' })
  date_adhesion!: string;

  @Prop({ default: false })
  cotisation_payee!: boolean;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status!: string;

  @Prop({ default: false })
  isAdmin!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);