import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MouvementStock } from './mouvement-stock.entity.js';
import { User } from '../auth/user.entity.js';
import { CreateMouvementDto } from './dto/create-mouvement.dto.js';

@Injectable()
export class StocksService {
  constructor(
    @InjectModel(MouvementStock)
    private readonly mouvementModel: typeof MouvementStock,
  ) {}

  async findByCycle(cycleId: string) {
    return this.mouvementModel.findAll({
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
  }

  async create(dto: CreateMouvementDto, userId?: string) {
    const VALID_TYPES = ['aliment', 'vaccin', 'litiere'];
    const VALID_SENS = ['entree', 'sortie'];

    if (!VALID_TYPES.includes(dto.type_stock)) {
      throw new Error(
        `Type de stock invalide. Valeurs autorisées : ${VALID_TYPES.join(', ')}`,
      );
    }
    if (!VALID_SENS.includes(dto.sens)) {
      throw new Error(
        `Sens invalide. Valeurs autorisées : ${VALID_SENS.join(', ')}`,
      );
    }

    return this.mouvementModel.create({
      cycle_id: dto.cycle_id,
      type_stock: dto.type_stock,
      sens: dto.sens,
      quantite: dto.quantite,
      unite: dto.unite || 'kg',
      cout: dto.cout || 0,
      date: dto.date,
      fournisseur: dto.fournisseur || null,
      notes: dto.notes || null,
      created_by: userId || null,
      created_at: new Date(),
    });
  }

  async remove(id: string) {
    const mouvement = await this.mouvementModel.findByPk(id);
    if (!mouvement) {
      throw new NotFoundException(`Mouvement de stock #${id} non trouvé`);
    }
    await mouvement.destroy();
    return { message: 'Mouvement de stock supprimé' };
  }
}
