import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { VentesService } from './ventes.service.js';
import { CreateVenteDto } from './dto/create-vente.dto.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentesController {
  constructor(@Inject(VentesService) private readonly ventesService: VentesService) {}

  @Get('cycles/:cycleId/ventes')
  findByCycle(@Param('cycleId') cycleId: string) {
    return this.ventesService.findByCycle(cycleId);
  }

  @Get('ventes')
  findAll() {
    return this.ventesService.findAll();
  }

  @Get('ventes/:id')
  findById(@Param('id') id: string) {
    return this.ventesService.findById(id);
  }

  @Roles('admin', 'employe', 'comptable')
  @Post('ventes')
  create(
    @Body() dto: CreateVenteDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    if (
      req.user.role === 'employe' &&
      (dto.statut_paiement !== 'paye' || dto.mode_paiement !== 'especes')
    ) {
      throw new ForbiddenException(
        "L'employé ne peut enregistrer que des ventes payées comptant",
      );
    }
    return this.ventesService.create(dto, req.user.id);
  }

  @Roles('admin', 'comptable')
  @Put('ventes/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateVenteDto>) {
    return this.ventesService.update(id, dto);
  }

  @Roles('admin', 'comptable')
  @Delete('ventes/:id')
  remove(@Param('id') id: string) {
    return this.ventesService.remove(id);
  }
}
