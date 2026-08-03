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
import { User } from '../auth/user.entity.js';

@Table({ tableName: 'depenses', timestamps: false })
export class Depense extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Cycle)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' })
  declare cycle_id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare categorie: 'poussins' | 'aliments' | 'veterinaire' | 'infrastructure' | 'imprevu';

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare montant: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, onDelete: 'SET NULL' })
  declare created_by: string | null;

  @BelongsTo(() => Cycle)
  cycle!: Cycle;

  @BelongsTo(() => User)
  creator!: User;
}
