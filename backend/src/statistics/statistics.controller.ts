import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';
import { StatisticsService } from './statistics.service';

type AuthenticatedRequest = {
  user?: { userId?: string; sub?: string };
};

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Roles('Director Executive')
  @Get('executive-dashboard')
  getExecutiveDashboard() {
    return this.statisticsService.getExecutiveDashboard();
  }

  @Roles('Team Manager')
  @Get('team-dashboard')
  getTeamManagerDashboard(@Req() req: AuthenticatedRequest) {
    return this.statisticsService.getTeamManagerDashboard(getUserId(req));
  }

  @Roles('Responsable')
  @Get('responsable-dashboard')
  getResponsableDashboard(@Req() req: AuthenticatedRequest) {
    return this.statisticsService.getResponsableDashboard(getUserId(req));
  }

  @Roles('Member')
  @Get('member-dashboard')
  getMemberDashboard(@Req() req: AuthenticatedRequest) {
    return this.statisticsService.getMemberDashboard(getUserId(req));
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Get('dashboard')
  getDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('departmentId') departmentId?: string,
    @Query('memberId') memberId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('period') period?: string,
  ) {
    return this.statisticsService.getDashboard(getUserId(req), {
      departmentId,
      memberId,
      from,
      to,
      period,
    });
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Get('departments/:departmentId')
  getDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('departmentId') departmentId: string,
  ) {
    return this.statisticsService.getDepartmentSummary(
      getUserId(req),
      departmentId,
    );
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Get('members/:memberId')
  getMember(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
  ) {
    return this.statisticsService.getMemberSummary(getUserId(req), memberId);
  }
}
