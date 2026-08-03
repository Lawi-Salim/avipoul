import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Mortalite } from './mortalite.entity.js';
import { Cycle } from '../cycles/cycle.entity.js';
import { User } from '../auth/user.entity.js';
import { CreateMortaliteDto } from './dto/create-mortalite.dto.js';

@Injectable()
export class SanteService {
  constructor(
    @InjectModel(Mortalite)
    private readonly mortaliteModel: typeof Mortalite,
    @InjectModel(Cycle)
    private readonly cycleModel: typeof Cycle,
  ) {}

  async findByCycle(cycleId: string) {
    const mortalites = await this.mortaliteModel.findAll({
      where: { cycle_id: cycleId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom'],
        },
      ],
      order: [['date', 'DESC']],
    });

    const cycle = await this.cycleModel.findByPk(cycleId);
    if (!cycle) {
      throw new NotFoundException(`Cycle #${cycleId} non trouvé`);
    }

    const mortaliteCumulee = mortalites.reduce(
      (sum, m) => sum + m.nombre,
      0,
    );
    const effectifVivant = cycle.effectif_initial - mortaliteCumulee;
    const tauxMortalite =
      cycle.effectif_initial > 0
        ? parseFloat(
            ((mortaliteCumulee / cycle.effectif_initial) * 100).toFixed(2),
          )
        : 0;

    return {
      mortalites,
      resume: {
        effectif_initial: cycle.effectif_initial,
        mortalite_cumulee: mortaliteCumulee,
        effectif_vivant: effectifVivant,
        taux_mortalite_pct: tauxMortalite,
      },
    };
  }

  async create(dto: CreateMortaliteDto, userId?: string) {
    return this.mortaliteModel.create({
      cycle_id: dto.cycle_id,
      date: dto.date,
      nombre: dto.nombre,
      cause: dto.cause || null,
      created_by: userId || null,
      created_at: new Date(),
    });
  }

  async remove(id: string) {
    const mortalite = await this.mortaliteModel.findByPk(id);
    if (!mortalite) {
      throw new NotFoundException(`Mortalité #${id} non trouvée`);
    }
    await mortalite.destroy();
    return { message: 'Entrée de mortalité supprimée' };
  }
}
