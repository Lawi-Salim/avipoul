import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { User } from './auth/user.entity.js';
import { Cycle } from './cycles/cycle.entity.js';
import { MouvementStock } from './stocks/mouvement-stock.entity.js';
import { ProduitVeterinaire } from './stocks/produit-veterinaire.entity.js';
import { Mortalite } from './sante/mortalite.entity.js';
import { Vaccination } from './sante/vaccination.entity.js';
import { Parametrage } from './parametrages/parametrage.entity.js';
import { Depense } from './finances/depense.entity.js';
import { Vente } from './ventes/vente.entity.js';
import { Client } from './clients/client.entity.js';
import { Alerte } from './alertes/alerte.entity.js';
import { Risque } from './risques/risque.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { CyclesModule } from './cycles/cycles.module.js';
import { StocksModule } from './stocks/stocks.module.js';
import { SanteModule } from './sante/sante.module.js';
import { ParametragesModule } from './parametrages/parametrages.module.js';
import { FinancesModule } from './finances/finances.module.js';
import { VentesModule } from './ventes/ventes.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { AlertesModule } from './alertes/alertes.module.js';
import { RisquesModule } from './risques/risques.module.js';
import { JobsModule } from './common/jobs/jobs.module.js';
import { ProduitsVeterinairesModule } from './stocks/produits-veterinaires.module.js';
import { VaccinationsModule } from './sante/vaccinations.module.js';
import { RapportsModule } from './rapports/rapports.module.js';
import { RemisesModule } from './remises/remises.module.js';
import { RemiseConfiguration } from './remises/remise.entity.js';
import { ExportModule } from './export/export.module.js';
import { ValidationsModule } from './validations/validations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { RechercheModule } from './recherche/recherche.module.js';

@Module({
  imports: [
    SequelizeModule.forRoot({
      uri: process.env.DATABASE_URL,
      dialect: 'postgres',
      logging: false,
      models: [User, Cycle, MouvementStock, ProduitVeterinaire, Mortalite, Vaccination, Parametrage, Depense, Vente, Client, Alerte, Risque, RemiseConfiguration],
      synchronize: false,
    }),
    AuthModule,
    CyclesModule,
    StocksModule,
    SanteModule,
    ParametragesModule,
    FinancesModule,
    VentesModule,
    ClientsModule,
    AlertesModule,
    RisquesModule,
    JobsModule,
    ProduitsVeterinairesModule,
    VaccinationsModule,
    RapportsModule,
    RemisesModule,
    ExportModule,
    ValidationsModule,
    NotificationsModule,
    RechercheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
