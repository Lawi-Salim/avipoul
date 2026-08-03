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

@Table({ tableName: 'risques', timestamps: true })
export class Risque extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare categorie: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare mesure_preventive: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare seuil_alerte: string | null;

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
