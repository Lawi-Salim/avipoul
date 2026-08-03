import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Vente } from '../ventes/vente.entity.js';
import { MouvementStock } from '../stocks/mouvement-stock.entity.js';
import { Mortalite } from '../sante/mortalite.entity.js';
import { Risque } from '../risques/risque.entity.js';
import { ValidationsService } from './validations.service.js';
import { ValidationsController } from './validations.controller.js';

@Module({
  imports: [SequelizeModule.forFeature([Vente, MouvementStock, Mortalite, Risque])],
  controllers: [ValidationsController],
  providers: [ValidationsService],
  exports: [ValidationsService],
})
export class ValidationsModule {}
