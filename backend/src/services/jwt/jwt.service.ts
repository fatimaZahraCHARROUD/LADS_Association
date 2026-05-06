import { JwtService as NestJwtService } from '@nestjs/jwt';
import { env } from '../../config/env.config';
import { StringValue } from 'ms';


export class JwtCustomService {
  private jwt = new NestJwtService({
    secret: env.JWT_SECRET,
    signOptions: {    expiresIn: (env.JWT_EXPIRES_IN || '1d') as StringValue },
  });

  sign(payload: any) {
    return this.jwt.sign(payload);
  }

  verify(token: string) {
    return this.jwt.verify(token);
  }
}