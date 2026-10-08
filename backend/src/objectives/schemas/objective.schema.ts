import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type ObjectiveDocument = Objective & Document;

// Collection "objectives" : les objectifs hebdomadaires posés par le Responsable
@Schema({ timestamps: true })
export class Objective {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ required: true })
  weekStart!: Date; // début de la semaine

  @Prop({ required: true })
  weekEnd!: Date; // fin de la semaine (1 à 2 semaines)

  @Prop({ default: 0 })
  target!: number; // objectif cible (nombre)

  @Prop({ default: 0 })
  achievement!: number; // réalisé

  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number; // progression en % (calculée automatiquement)

  @Prop({ enum: ['pending', 'in-progress', 'completed'], default: 'in-progress' })
  status!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', default: null })
  departmentId!: Types.ObjectId | null; // département concerné (filtre)

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId; // qui a créé l'objectif
}

export const ObjectiveSchema = SchemaFactory.createForClass(Objective);