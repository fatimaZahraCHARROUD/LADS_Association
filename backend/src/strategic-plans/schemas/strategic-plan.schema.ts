import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type StrategicPlanDocument = StrategicPlan & Document;
@Schema({ timestamps: true, collection: 'strategic_plans' })
export class StrategicPlan {
      @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  objective!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ required: true })
  deadline!: Date;

  @Prop({
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}
export const StrategicPlanSchema = SchemaFactory.createForClass(StrategicPlan);