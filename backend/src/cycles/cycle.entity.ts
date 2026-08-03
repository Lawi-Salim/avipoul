import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  HasMany,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../auth/user.entity.js';
import { MouvementStock } from '../stocks/mouvement-stock.entity.js';
import { Mortalite } from '../sante/mortalite.entity.js';

@Table({ tableName: 'cycles', timestamps: true })
export class Cycle extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare numero_cycle: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date_reception: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare effectif_initial: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare cout_achat_poussins: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'preparation',
  })
  declare phase_courante: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'en_cours' })
  declare statut: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare phase_changed_at: Date | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare date_cloture: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare bilan_cout_total: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare bilan_recettes: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare bilan_marge: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare bilan_mortalite_cumulee: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare bilan_cout_revient_par_poulet: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare bilan_seuil_rentabilite: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare created_by: string | null;

  @BelongsTo(() => User)
  creator!: User;

  @HasMany(() => MouvementStock)
  mouvements_stock!: MouvementStock[];

  @HasMany(() => Mortalite)
  mortalites!: Mortalite[];

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare updated_at: Date;
}
