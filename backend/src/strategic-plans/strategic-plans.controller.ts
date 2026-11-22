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
import { StrategicPlansService } from './strategic-plans.service';
import { CreateStrategicPlanDto } from './dto/create-strategic-plan.dto';
import { UpdateStrategicPlanDto } from './dto/update-strategic-plan.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Roles('President', 'Director Executive')
@Controller('strategic-plans')
export class StrategicPlansController {
  constructor(private readonly plansService: StrategicPlansService) {}

  @Post()
  create(@Body() dto: CreateStrategicPlanDto, @Req() req: any) {
    return this.plansService.create(dto, getUserId(req));
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.plansService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.plansService.updateStatus(id, status);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStrategicPlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}