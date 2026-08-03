import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Vente } from '../ventes/vente.entity.js';
import { MouvementStock } from '../stocks/mouvement-stock.entity.js';
import { Mortalite } from '../sante/mortalite.entity.js';
import { Risque } from '../risques/risque.entity.js';
import { Cycle } from '../cycles/cycle.entity.js';
import { Client } from '../clients/client.entity.js';
import { User } from '../auth/user.entity.js';

@Injectable()
export class ValidationsService {
  constructor(
    @InjectModel(Vente)
    private readonly venteModel: typeof Vente,
    @InjectModel(MouvementStock)
    private readonly mouvementModel: typeof MouvementStock,
    @InjectModel(Mortalite)
    private readonly mortaliteModel: typeof Mortalite,
    @InjectModel(Risque)
    private readonly risqueModel: typeof Risque,
  ) {}

  async getAVaider() {
    const [ventes, stocks, mortalites, risques] = await Promise.all([
      this.venteModel.findAll({
        where: { valide_le: null },
        include: [
          { model: Client, attributes: ['id', 'nom', 'type_client'] },
          { model: Cycle, attributes: ['id', 'numero_cycle', 'statut'] },
          { model: User, as: 'creator', attributes: ['id', 'nom', 'prenom'] },
          { model: User, as: 'valideur', attributes: ['id', 'nom', 'prenom'] },
        ],
        order: [['date', 'DESC']],
        limit: 100,
      }),
      this.mouvementModel.findAll({
        where: { sens: 'sortie', valide_le: null },
        include: [
          { model: Cycle, attributes: ['id', 'numero_cycle', 'statut'] },
          { model: User, as: 'creator', attributes: ['id', 'nom', 'prenom'] },
          { model: User, as: 'valideur', attributes: ['id', 'nom', 'prenom'] },
        ],
        order: [['date', 'DESC']],
        limit: 100,
      }),
      this.mortaliteModel.findAll({
        where: { valide_le: null },
        include: [
          { model: Cycle, attributes: ['id', 'numero_cycle', 'statut'] },
          { model: User, as: 'creator', attributes: ['id', 'nom', 'prenom'] },
          { model: User, as: 'valideur', attributes: ['id', 'nom', 'prenom'] },
        ],
        order: [['date', 'DESC']],
        limit: 100,
      }),
      this.risqueModel.findAll({
        where: { actif: true },
        include: [
          { model: User, as: 'creator', attributes: ['id', 'nom', 'prenom'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 100,
      }),
    ]);

    return { ventes, stocks, mortalites, risques };
  }

  async validerVente(id: string, userId: string) {
    const vente = await this.venteModel.findByPk(id);
    if (!vente) throw new NotFoundException(`Vente #${id} non trouvée`);
    await vente.update({ valide_le: new Date(), valide_par: userId });
    return vente;
  }

  async validerStock(id: string, userId: string) {
    const mouvement = await this.mouvementModel.findByPk(id);
    if (!mouvement) throw new NotFoundException(`Mouvement de stock #${id} non trouvé`);
    await mouvement.update({ valide_le: new Date(), valide_par: userId });
    return mouvement;
  }

  async validerMortalite(id: string, userId: string) {
    const mortalite = await this.mortaliteModel.findByPk(id);
    if (!mortalite) throw new NotFoundException(`Mortalité #${id} non trouvée`);
    await mortalite.update({ valide_le: new Date(), valide_par: userId });
    return mortalite;
  }
}
