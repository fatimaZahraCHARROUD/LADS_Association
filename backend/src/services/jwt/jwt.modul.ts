import { Module } from '@nestjs/common';
 import { JwtCustomService } from './jwt.service';


@Module({
    providers: [JwtCustomService],
     exports: [JwtCustomService],

})
export class JwtModule {}