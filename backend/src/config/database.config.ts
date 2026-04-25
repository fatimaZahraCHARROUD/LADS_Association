import { MongooseModule } from '@nestjs/mongoose';

export const DatabaseConfig = MongooseModule.forRoot(
  'mongodb://localhost:27017/LADS',
);