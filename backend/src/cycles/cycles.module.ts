import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cycle } from './cycle.entity.js';
import { Mortalite } from '../sante/mortalite.entity.js';
import { MouvementStock } from '../stocks/mouvement-stock.entity.js';
import { Depense } from '../finances/depense.entity.js';
import { Vente } from '../ventes/vente.entity.js';
import { Parametrage } from '../parametrages/parametrage.entity.js';
import { Risque } from '../risques/risque.entity.js';
import { CyclesService } from './cycles.service.js';
import { CyclesController } from './cycles.controller.js';

@Module({
  imports: [SequelizeModule.forFeature([Cycle, Mortalite, MouvementStock, Depense, Vente, Parametrage, Risque])],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
