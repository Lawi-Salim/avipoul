import { Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ValidationsService } from './validations.service.js';

@Controller('validations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'comptable')
export class ValidationsController {
  constructor(@Inject(ValidationsService) private readonly validationsService: ValidationsService) {}

  @Get('a-valider')
  getAVaider() {
    return this.validationsService.getAVaider();
  }

  @Post('vente/:id/valider')
  validerVente(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.validationsService.validerVente(id, req.user.id);
  }

  @Post('stock/:id/valider')
  validerStock(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.validationsService.validerStock(id, req.user.id);
  }

  @Post('mortalite/:id/valider')
  validerMortalite(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.validationsService.validerMortalite(id, req.user.id);
  }
}
