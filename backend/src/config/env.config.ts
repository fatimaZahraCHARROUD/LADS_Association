import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret?.trim()) {
  throw new Error(
    'JWT_SECRET is required. Set it in backend/.env or in the backend process environment.',
  );
}

export const env = {
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};
