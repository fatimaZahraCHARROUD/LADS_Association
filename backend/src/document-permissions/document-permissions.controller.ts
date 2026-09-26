import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentPermissionsService } from './document-permissions.service';
import { CreateDocumentPermissionDto } from './dto/create-document-permission.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Controller('document-permissions')
export class DocumentPermissionsController {
  constructor(private readonly service: DocumentPermissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDocumentPermissionDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findByDocument(@Query('documentId') documentId: string) {
    return this.service.findByDocument(documentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
