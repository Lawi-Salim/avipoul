import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Cycle } from '../cycles/cycle.entity.js';
import { Client } from '../clients/client.entity.js';
import { User } from '../auth/user.entity.js';

@Table({ tableName: 'ventes', timestamps: false })
export class Vente extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Cycle)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  declare cycle_id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare client_id: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantite: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare prix_unitaire: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'especes',
  })
  declare mode_paiement: 'especes' | 'cheque' | 'virement' | 'credit';

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'paye',
  })
  declare statut_paiement: 'paye' | 'partiel' | 'impaye';

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'poulet_vif',
  })
  declare categorie_produit: 'poulet_vif' | 'poulet_abattu' | 'poulet_entier' | 'poulet_fermier' | 'poulet_morceaux' | 'poulet_cuisse' | 'poulet_ailes';

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare remise: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare created_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare valide_le: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare valide_par: string | null;

  @BelongsTo(() => Cycle)
  cycle!: Cycle;

  @BelongsTo(() => Client)
  client!: Client;

  @BelongsTo(() => User)
  creator!: User;

  @BelongsTo(() => User)
  valideur!: User;
}
