import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

// Ce type combine la classe Cellule + les fonctionnalités de Mongoose (Document)
export type CelluleDocument = Cellule & Document;

// Un "schéma" = la définition des champs d'un document de la collection "cellules"
// timestamps: true ajoute automatiquement createdAt et updatedAt
@Schema({ timestamps: true })
export class Cellule {
  @Prop({ required: true, trim: true })
  name!: string; // nom de la cellule (ex: "IT Web", "IT Mobile"...)

  @Prop({ default: '' })
  description!: string;

  // Référence vers une collection Department (le département auquel la cellule appartient)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Department', required: true })
  departmentId!: Types.ObjectId;

  // Référence vers un User (le responsable/manager de la cellule)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  managerId!: Types.ObjectId;

  // Tableau de références User (les membres de la cellule)
  @Prop({ type: [SchemaTypes.ObjectId], ref: 'User', default: [] })
  members!: Types.ObjectId[];

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status!: string;
}

// SchemaFactory transforme la classe en un schéma Mongoose utilisable
export const CelluleSchema = SchemaFactory.createForClass(Cellule);