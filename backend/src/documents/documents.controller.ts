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
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(WriterRoleGuard)
  @Post()
  create(@Body() dto: CreateDocumentDto, @Req() req: any) {
    return this.documentsService.create(dto, getUserId(req));
  }

  @Get()
  findAll(@Req() req: any, @Query('category') category?: string) {
    return this.documentsService.findAll(getUserId(req), category);
  }

  @Get('meta/departments')
  listDepartmentOptions() {
    return this.documentsService.listDepartmentOptions();
  }

  @Get('meta/my-departments')
  listMyDepartments(@Req() req: any) {
    return this.documentsService.listMyDepartments(getUserId(req));
  }

  @Get('meta/writable-departments')
  listWritableDepartments(@Req() req: any) {
    return this.documentsService.listWritableDepartments(getUserId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, getUserId(req));
  }

  @UseGuards(WriterRoleGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.update(id, dto, getUserId(req));
  }

  @UseGuards(WriterRoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.remove(id, getUserId(req));
  }
}
