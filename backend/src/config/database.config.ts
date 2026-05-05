import { MongooseModule } from '@nestjs/mongoose';

export const DatabaseConfig = MongooseModule.forRoot(
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS',
);