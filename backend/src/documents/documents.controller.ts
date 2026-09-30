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
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable', 'Member')
  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: any) {
    return this.documentsService.create(dto, getUserId(req));
  }

  @Get()
  findAll(@Req() req: any, @Query('category') category?: string) {
    return this.documentsService.findAll(getUserId(req), category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable', 'Member')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable', 'Member')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}