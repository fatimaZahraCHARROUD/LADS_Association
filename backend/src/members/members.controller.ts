import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MembersService } from './members.service';
import type { MemberFilter } from './members.service';
import { multerOptions } from './multer.config';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('profileImage', multerOptions))
  create(
    @Body() dto: CreateMemberDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.membersService.create(dto, file);
  }

  @Get()
  findAll() {
    return this.membersService.findAll();
  }

  @Get('search')
  search(@Query() query: MemberFilter) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('profileImage', multerOptions))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.membersService.update(id, dto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}