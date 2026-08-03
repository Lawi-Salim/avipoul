import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Client } from '../clients/client.entity.js';
import { Cycle } from '../cycles/cycle.entity.js';
import { ProduitVeterinaire } from '../stocks/produit-veterinaire.entity.js';
import { User } from '../auth/user.entity.js';
import { Vente } from '../ventes/vente.entity.js';
import { Depense } from '../finances/depense.entity.js';
import { RechercheService } from './recherche.service.js';
import { RechercheController } from './recherche.controller.js';

@Module({
  imports: [
    SequelizeModule.forFeature([Client, Cycle, ProduitVeterinaire, User, Vente, Depense]),
  ],
  controllers: [RechercheController],
  providers: [RechercheService],
})
export class RechercheModule {}
