import { Controller, Get, UseGuards } from '@nestjs/common';
import { FormationsService } from './formations.service';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

// Member page: published formations + the Drive recording link.
// No @Roles here: any logged-in user can read it.
@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('member/formations')
export class MemberFormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  findForMembers() {
    return this.formationsService.findForMembers();
  }
}

// Admin page: every formation, drafts included, with the private Drive link.
@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Roles('President', 'Director Executive')
@Controller('admin/formations')
export class AdminFormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  findAllForAdmin() {
    return this.formationsService.findAllForAdmin();
  }
}