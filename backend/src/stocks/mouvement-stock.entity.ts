import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
} from 'sequelize-typescript';
import { Cycle } from '../cycles/cycle.entity.js';
import { User } from '../auth/user.entity.js';

@Table({ tableName: 'mouvements_stock', timestamps: false })
export class MouvementStock extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Cycle)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  declare cycle_id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare type_stock: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare sens: string;

  @Column({ type: DataType.DECIMAL(12, 3), allowNull: false })
  declare quantite: number;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'kg' })
  declare unite: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare cout: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare fournisseur: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

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

  @BelongsTo(() => User)
  creator!: User;

  @BelongsTo(() => User)
  valideur!: User;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare created_at: Date;
}
