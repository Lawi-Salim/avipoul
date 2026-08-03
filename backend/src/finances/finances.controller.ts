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
import { FinancesService } from './finances.service.js';
import { CreateDepenseDto } from './dto/create-depense.dto.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancesController {
  constructor(@Inject(FinancesService) private readonly financesService: FinancesService) {}

  @Get('cycles/:cycleId/depenses')
  findByCycle(@Param('cycleId') cycleId: string) {
    return this.financesService.findByCycle(cycleId);
  }

  @Roles('admin', 'comptable')
  @Post('depenses')
  create(
    @Body() dto: CreateDepenseDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.financesService.create(dto, req.user.id);
  }

  @Roles('admin', 'comptable')
  @Put('depenses/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDepenseDto>) {
    return this.financesService.update(id, dto);
  }

  @Roles('admin', 'comptable')
  @Delete('depenses/:id')
  remove(@Param('id') id: string) {
    return this.financesService.remove(id);
  }
}
