import api from './api';
import { Risque } from './risques.service';

export interface ValidationUser {
  id: string;
  nom: string;
  prenom: string;
}

export interface ValidationCycle {
  id: string;
  numero_cycle: number;
  statut: string;
}

export interface ValidationClient {
  id: string;
  nom: string;
  type_client: string;
}

export interface ValidationVente {
  id: string;
  cycle_id: string;
  client_id: string | null;
  quantite: number;
  prix_unitaire: number;
  date: string;
  mode_paiement: string;
  statut_paiement: string;
  categorie_produit: string;
  remise: number;
  client?: ValidationClient | null;
  cycle?: ValidationCycle | null;
  creator?: ValidationUser | null;
}

export interface ValidationStock {
  id: string;
  cycle_id: string;
  type_stock: string;
  sens: string;
  quantite: number;
  unite: string;
  cout: number;
  date: string;
  notes: string | null;
  cycle?: ValidationCycle | null;
  creator?: ValidationUser | null;
}

export interface ValidationMortalite {
  id: string;
  cycle_id: string;
  date: string;
  nombre: number;
  cause: string | null;
  cycle?: ValidationCycle | null;
  creator?: ValidationUser | null;
}

export interface AVaiderData {
  ventes: ValidationVente[];
  stocks: ValidationStock[];
  mortalites: ValidationMortalite[];
  risques: Risque[];
}

export const validationsService = {
  getAVaider: () =>
    api.get<AVaiderData>('/validations/a-valider').then((r) => r.data),

  validerVente: (id: string) =>
    api.post(`/validations/vente/${id}/valider`).then((r) => r.data),

  validerStock: (id: string) =>
    api.post(`/validations/stock/${id}/valider`).then((r) => r.data),

  validerMortalite: (id: string) =>
    api.post(`/validations/mortalite/${id}/valider`).then((r) => r.data),
};
