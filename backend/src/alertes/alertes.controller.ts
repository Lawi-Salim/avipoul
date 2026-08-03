import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AlertesService } from './alertes.service.js';

@Controller('alertes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertesController {
  constructor(@Inject(AlertesService) private readonly alertesService: AlertesService) {}

  @Get()
  findAll() {
    return this.alertesService.findAll();
  }

  @Get('toutes')
  findAllWithResolved() {
    return this.alertesService.findAllWithResolved();
  }

  @Get('non-resolues')
  getNonResolues() {
    return this.alertesService.getAlertesNonResolues();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertesService.findOne(id);
  }

  @Roles('admin', 'comptable')
  @Patch(':id/resoudre')
  markAsResolue(@Param('id') id: string) {
    return this.alertesService.markAsResolue(id);
  }

  @Roles('admin', 'comptable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertesService.remove(id);
  }
}
