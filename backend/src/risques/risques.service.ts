import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Risque } from './risque.entity.js';
import { User } from '../auth/user.entity.js';
import { CreateRisqueDto } from './dto/create-risque.dto.js';
import { UpdateRisqueDto } from './dto/update-risque.dto.js';

@Injectable()
export class RisquesService {
  constructor(
    @InjectModel(Risque)
    private readonly risqueModel: typeof Risque,
  ) {}

  async findAll() {
    return this.risqueModel.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findActifs() {
    return this.risqueModel.findAll({
      where: { actif: true },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const risque = await this.risqueModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom'],
        },
      ],
    });
    if (!risque) throw new NotFoundException(`Risque #${id} non trouvé`);
    return risque;
  }

  async create(dto: CreateRisqueDto, userId?: string) {
    return this.risqueModel.create({
      ...dto,
      created_by: userId || null,
    });
  }

  async update(id: string, dto: UpdateRisqueDto) {
    const risque = await this.findOne(id);
    await risque.update(dto);
    return risque;
  }

  async remove(id: string) {
    const risque = await this.findOne(id);
    await risque.destroy();
    return { message: 'Risque supprimé' };
  }
}
