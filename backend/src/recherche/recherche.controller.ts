import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { RechercheService } from './recherche.service.js';

@Controller('recherche')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RechercheController {
  constructor(@Inject(RechercheService) private readonly rechercheService: RechercheService) {}

  @Get()
  rechercher(
    @Query('q') q: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.rechercheService.rechercher(q || '', req.user.role);
  }
}
