import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};