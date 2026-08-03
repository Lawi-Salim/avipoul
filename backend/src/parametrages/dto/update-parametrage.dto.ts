import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateParametrageDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cout_standard_poussin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prix_vente_standard?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsPositive()
  seuil_mortalite_critique_pct?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  seuil_stock_bas_jours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_preparation?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_demarrage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_croissance?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_finition?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_commercialisation?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duree_phase_nettoyage?: number;
}
