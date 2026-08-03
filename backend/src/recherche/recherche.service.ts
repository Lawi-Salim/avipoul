import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { Client } from '../clients/client.entity.js';
import { Cycle } from '../cycles/cycle.entity.js';
import { ProduitVeterinaire } from '../stocks/produit-veterinaire.entity.js';
import { User } from '../auth/user.entity.js';
import { Vente } from '../ventes/vente.entity.js';
import { Depense } from '../finances/depense.entity.js';

@Injectable()
export class RechercheService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(Cycle)
    private readonly cycleModel: typeof Cycle,
    @InjectModel(ProduitVeterinaire)
    private readonly produitModel: typeof ProduitVeterinaire,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Vente)
    private readonly venteModel: typeof Vente,
    @InjectModel(Depense)
    private readonly depenseModel: typeof Depense,
  ) {}

  private accent(col: string) {
    return Sequelize.fn('unaccent', Sequelize.col(col));
  }

  private castText(col: string) {
    return Sequelize.cast(Sequelize.col(col), 'TEXT');
  }

  async rechercher(q: string, role: string) {
    const terme = q.trim();
    if (!terme) {
      return { clients: [], cycles: [], produits: [], utilisateurs: [], ventes: [], depenses: [] };
    }

    const like = `%${terme}%`;
    const termeInsensible = Sequelize.fn('unaccent', like);

    const [clients, cycles, produits, utilisateurs, ventes, depenses] = await Promise.all([
      ['admin', 'comptable'].includes(role)
        ? this.clientModel.findAll({
            where: {
              [Op.or]: [
                Sequelize.where(this.accent('nom'), { [Op.iLike]: termeInsensible }),
                Sequelize.where(this.accent('contact'), { [Op.iLike]: termeInsensible }),
                Sequelize.where(this.accent('adresse'), { [Op.iLike]: termeInsensible }),
              ],
            },
            attributes: ['id', 'nom', 'type_client', 'contact', 'adresse'],
            order: [['nom', 'ASC']],
            limit: 5,
          })
        : Promise.resolve([]),
      this.cycleModel.findAll({
        where: Sequelize.where(
          this.castText('numero_cycle'),
          { [Op.iLike]: termeInsensible }
        ),
        attributes: ['id', 'numero_cycle', 'statut', 'date_reception'],
        order: [['numero_cycle', 'DESC']],
        limit: 5,
      }),
      ['admin', 'employe'].includes(role)
        ? this.produitModel.findAll({
            where: Sequelize.where(this.accent('nom'), { [Op.iLike]: termeInsensible }),
            attributes: ['id', 'nom', 'type_produit', 'quantite_stock', 'unite'],
            order: [['nom', 'ASC']],
            limit: 5,
          })
        : Promise.resolve([]),
      role === 'admin'
        ? this.userModel.findAll({
            where: {
              [Op.or]: [
                Sequelize.where(this.accent('nom'), { [Op.iLike]: termeInsensible }),
                Sequelize.where(this.accent('prenom'), { [Op.iLike]: termeInsensible }),
              ],
            },
            attributes: ['id', 'nom', 'prenom', 'role'],
            order: [['nom', 'ASC']],
            limit: 5,
          })
        : Promise.resolve([]),
      this.venteModel.findAll({
        include: [
          {
            model: Client,
            attributes: ['id', 'nom', 'type_client'],
            required: false,
          },
          {
            model: Cycle,
            attributes: ['id', 'numero_cycle'],
            required: false,
          },
        ],
        where: {
          [Op.or]: [
            Sequelize.where(this.accent('client.nom'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.castText('cycle.numero_cycle'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.accent('categorie_produit'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.accent('mode_paiement'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.accent('statut_paiement'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.castText('date'), { [Op.iLike]: termeInsensible }),
          ],
        },
        attributes: [
          'id',
          'date',
          'quantite',
          'prix_unitaire',
          'remise',
          'mode_paiement',
          'statut_paiement',
          'categorie_produit',
          'cycle_id',
        ],
        order: [['date', 'DESC']],
        limit: 8,
      }),
      this.depenseModel.findAll({
        include: [
          {
            model: Cycle,
            attributes: ['id', 'numero_cycle'],
            required: false,
          },
        ],
        where: {
          [Op.or]: [
            Sequelize.where(this.accent('categorie'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.accent('description'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.castText('date'), { [Op.iLike]: termeInsensible }),
            Sequelize.where(this.castText('montant'), { [Op.iLike]: termeInsensible }),
          ],
        },
        attributes: ['id', 'categorie', 'montant', 'date', 'description', 'cycle_id'],
        order: [['date', 'DESC']],
        limit: 8,
      }),
    ]);

    return {
      clients: clients.map((c) => c.toJSON()),
      cycles: cycles.map((c) => c.toJSON()),
      produits: produits.map((p) => p.toJSON()),
      utilisateurs: utilisateurs.map((u) => u.toJSON()),
      ventes: ventes.map((v) => v.toJSON()),
      depenses: depenses.map((d) => d.toJSON()),
    };
  }
}
