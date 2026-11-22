import { TypeOrmModule } from '@nestjs/typeorm';

export const DatabaseConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME     ?? 'lads_db',
  entities:  [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production', // auto-migrate in dev
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: 'Z',
});
