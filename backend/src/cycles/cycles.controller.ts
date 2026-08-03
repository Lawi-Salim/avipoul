import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CyclesService } from './cycles.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';
import { UpdateCycleDto, UpdatePhaseDto } from './dto/update-cycle.dto.js';

@Controller('cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyclesController {
  constructor(@Inject(CyclesService) private readonly cyclesService: CyclesService) {}

  @Get()
  findAll(@Query('statut') statut?: string) {
    return this.cyclesService.findAll(statut);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cyclesService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.cyclesService.getStats(id);
  }

  @Get(':id/finances')
  getFinances(@Param('id') id: string) {
    return this.cyclesService.getFinances(id);
  }

  @Roles('admin', 'comptable')
  @Post()
  create(
    @Body() dto: CreateCycleDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.cyclesService.create({
      ...dto,
      created_by: req.user.id,
    });
  }

  @Roles('admin', 'comptable')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCycleDto) {
    return this.cyclesService.update(id, dto);
  }

  @Roles('admin', 'comptable')
  @Patch(':id/phase')
  updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    return this.cyclesService.updatePhase(id, dto.phase);
  }

  @Roles('admin')
  @Get(':id/verification-cloture')
  verifierCloture(@Param('id') id: string) {
    return this.cyclesService.verifierCloture(id);
  }

  @Roles('admin')
  @Post(':id/cloture')
  cloturer(@Param('id') id: string) {
    return this.cyclesService.cloturer(id);
  }
}
