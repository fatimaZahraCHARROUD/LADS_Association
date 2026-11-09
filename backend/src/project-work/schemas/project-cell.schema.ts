import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectCellDocument = HydratedDocument<ProjectCell>;

@Schema({ timestamps: true, collection: 'project_cells' })
export class ProjectCell {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members!: Types.ObjectId[];
}
export const ProjectCellSchema = SchemaFactory.createForClass(ProjectCell);
