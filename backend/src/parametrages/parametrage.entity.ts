import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../auth/user.entity.js';

@Table({ tableName: 'parametrages', timestamps: true })
export class Parametrage extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare cout_standard_poussin: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare prix_vente_standard: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 5.0,
  })
  declare seuil_mortalite_critique_pct: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 3 })
  declare seuil_stock_bas_jours: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 2 })
  declare duree_phase_preparation: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 7 })
  declare duree_phase_demarrage: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 21 })
  declare duree_phase_croissance: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 7 })
  declare duree_phase_finition: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 7 })
  declare duree_phase_commercialisation: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 2 })
  declare duree_phase_nettoyage: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare actif: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare created_by: string | null;

  @BelongsTo(() => User)
  creator!: User;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare updated_at: Date;
}
