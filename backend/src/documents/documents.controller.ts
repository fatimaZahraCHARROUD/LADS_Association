import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { getUserId } from '../services/jwt/current-user';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: any) {
    return this.documentsService.create(dto, getUserId(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: any,
    @Query('category') category?: string,
  ) {
    return this.documentsService.findAll(getUserId(req), category);
  }

  @UseGuards(JwtAuthGuard)
  @Get('meta/departments')
  listDepartmentOptions() {
    return this.documentsService.listDepartmentOptions();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
