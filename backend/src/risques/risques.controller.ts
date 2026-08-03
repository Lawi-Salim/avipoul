import {
  Body,
  Controller,
  Delete,
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
import { RisquesService } from './risques.service.js';
import { CreateRisqueDto } from './dto/create-risque.dto.js';
import { UpdateRisqueDto } from './dto/update-risque.dto.js';

@Controller('risques')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RisquesController {
  constructor(@Inject(RisquesService) private readonly risquesService: RisquesService) {}

  @Get()
  findAll() {
    return this.risquesService.findAll();
  }

  @Get('actifs')
  findActifs() {
    return this.risquesService.findActifs();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.risquesService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateRisqueDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.risquesService.create(dto, req.user.id);
  }

  @Roles('admin', 'comptable')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRisqueDto) {
    return this.risquesService.update(id, dto);
  }

  @Roles('admin', 'comptable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.risquesService.remove(id);
  }
}
