import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cycle } from '../cycles/cycle.entity.js';
import { Parametrage } from '../parametrages/parametrage.entity.js';
import { Alerte } from '../alertes/alerte.entity.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';

@Module({
  imports: [SequelizeModule.forFeature([Cycle, Parametrage, Alerte])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
