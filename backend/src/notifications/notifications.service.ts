import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cycle } from '../cycles/cycle.entity.js';
import { Parametrage } from '../parametrages/parametrage.entity.js';
import { Alerte } from '../alertes/alerte.entity.js';

export interface AppNotification {
  id: string;
  type: 'phase_bloquee' | 'age' | 'todo' | 'alerte';
  niveau: 'info' | 'warning' | 'critical';
  message: string;
  path: string;
}

const PHASE_ORDER = [
  'preparation',
  'demarrage',
  'croissance',
  'finition',
  'commercialisation',
  'nettoyage',
];

const PHASE_LABELS: Record<string, string> = {
  preparation: 'Préparation',
  demarrage: 'Démarrage',
  croissance: 'Croissance',
  finition: 'Finition',
  commercialisation: 'Commercialisation',
  nettoyage: 'Nettoyage',
};

const PHASE_TODO: Record<string, string[]> = {
  preparation: [
    'Nettoyer et désinfecter le poulailler',
    'Préparer la litière et les abreuvoirs',
    'Mettre le chauffage en route',
  ],
  demarrage: [
    'Chauffer la zone des poussins',
    "Donner de l'eau et des vitamines",
    'Surveiller la température',
  ],
  croissance: [
    "Donner l'aliment croissance",
    'Suivre la mortalité',
    'Faire les vaccins de rappel',
  ],
  finition: [
    "Donner l'aliment finition",
    'Surveiller le poids des poulets',
    'Préparer les ventes',
  ],
  commercialisation: [
    'Vendre les poulets aux clients',
    'Encaisser et valider les ventes',
  ],
  nettoyage: ['Désinfecter le poulailler', 'Préparer le prochain cycle'],
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Cycle) private readonly cycleModel: typeof Cycle,
    @InjectModel(Parametrage)
    private readonly parametrageModel: typeof Parametrage,
    @InjectModel(Alerte) private readonly alerteModel: typeof Alerte,
  ) {}

  async findAll(): Promise<AppNotification[]> {
    const notifications: AppNotification[] = [];
    const parametrage = await this.parametrageModel.findOne({
      where: { actif: true },
    });
    const durees = this.getDurees(parametrage);
    const cycles = await this.cycleModel.findAll({
      where: { statut: 'en_cours' },
    });
    const today = new Date();

    for (const cycle of cycles) {
      const numero = `#${cycle.numero_cycle}`;
      const phase = cycle.phase_courante;
      const label = PHASE_LABELS[phase] ?? phase;
      const index = PHASE_ORDER.indexOf(phase);
      const path = `/cycles/${cycle.id}`;

      const changedAt = cycle.phase_changed_at ?? cycle.created_at;
      const joursEnPhase = this.daysBetween(new Date(changedAt), today);
      const dureePhase = durees[phase] ?? 0;
      if (
        index >= 0 &&
        index < PHASE_ORDER.length - 1 &&
        dureePhase > 0 &&
        joursEnPhase > dureePhase
      ) {
        notifications.push({
          id: `phase-${cycle.id}`,
          type: 'phase_bloquee',
          niveau: 'warning',
          message: `Cycle ${numero} : ça fait ${joursEnPhase} jour(s) en phase « ${label} » alors que la durée prévue est de ${dureePhase} jour(s). Pense à avancer.`,
          path,
        });
      }

      const age = this.daysBetween(
        new Date(`${cycle.date_reception}T00:00:00`),
        today,
      );
      const attendue = this.phaseSelonAge(age, durees);
      const indexAttendue = attendue ? PHASE_ORDER.indexOf(attendue) : -1;
      if (
        attendue &&
        index >= 0 &&
        indexAttendue >= 0 &&
        index < indexAttendue
      ) {
        notifications.push({
          id: `age-${cycle.id}`,
          type: 'age',
          niveau: 'info',
          message: `Cycle ${numero} : d'après l'âge (${age} jour(s)), tu devrais être en phase « ${PHASE_LABELS[attendue]} ».`,
          path,
        });
      }

      const actions = PHASE_TODO[phase];
      if (actions && actions.length > 0) {
        notifications.push({
          id: `todo-${cycle.id}`,
          type: 'todo',
          niveau: 'info',
          message: `À faire (cycle ${numero} — ${label}) : ${actions.join(', ')}.`,
          path,
        });
      }
    }

    const alertes = await this.alerteModel.findAll({ where: { resolue: false } });
    for (const alerte of alertes) {
      notifications.push({
        id: `alerte-${alerte.id}`,
        type: 'alerte',
        niveau: alerte.niveau === 'critical' ? 'critical' : 'warning',
        message: alerte.message,
        path: '/risques',
      });
    }

    return notifications;
  }

  private getDurees(parametrage: Parametrage | null): Record<string, number> {
    return {
      preparation: parametrage?.duree_phase_preparation ?? 2,
      demarrage: parametrage?.duree_phase_demarrage ?? 7,
      croissance: parametrage?.duree_phase_croissance ?? 21,
      finition: parametrage?.duree_phase_finition ?? 7,
      commercialisation: parametrage?.duree_phase_commercialisation ?? 7,
      nettoyage: parametrage?.duree_phase_nettoyage ?? 2,
    };
  }

  private phaseSelonAge(
    age: number,
    durees: Record<string, number>,
  ): string | null {
    if (age < 0) return null;
    const dureeDemarrage = durees.demarrage ?? 0;
    const dureeCroissance = durees.croissance ?? 0;
    const dureeFinition = durees.finition ?? 0;
    const debutCroissance = dureeDemarrage;
    const debutFinition = debutCroissance + dureeCroissance;
    const debutCommercialisation = debutFinition + dureeFinition;
    if (age < debutCroissance) return 'demarrage';
    if (age < debutFinition) return 'croissance';
    if (age < debutCommercialisation) return 'finition';
    return 'commercialisation';
  }

  private daysBetween(from: Date, to: Date): number {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  }
}
