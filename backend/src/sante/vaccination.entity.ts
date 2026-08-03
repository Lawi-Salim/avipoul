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
import { Cycle } from '../cycles/cycle.entity.js';
import { ProduitVeterinaire } from '../stocks/produit-veterinaire.entity.js';
import { User } from '../auth/user.entity.js';

@Table({ tableName: 'vaccinations', timestamps: true })
export class Vaccination extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Cycle)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  declare cycle_id: string;

  @ForeignKey(() => ProduitVeterinaire)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare produit_id: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare produit: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date_prevue: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare date_realisee: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare rappel: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare created_by: string | null;

  @BelongsTo(() => Cycle)
  cycle!: Cycle;

  @BelongsTo(() => ProduitVeterinaire)
  produit_veterinaire!: ProduitVeterinaire;

  @BelongsTo(() => User)
  creator!: User;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare updated_at: Date;
}
