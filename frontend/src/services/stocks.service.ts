import api from './api';

export interface Stock {
  id: string;
  cycleId: string;
  type_stock: 'aliment' | 'vaccin' | 'litiere';
  sens: 'entree' | 'sortie';
  quantite: number;
  cout: number;
  date: string;
  fournisseur: string;
  created_at: string;
  creator?: { id: string; nom: string; prenom: string };
}

export interface CreateStockPayload {
  type_stock: 'aliment' | 'vaccin' | 'litiere';
  sens: 'entree' | 'sortie';
  quantite: number;
  cout: number;
  date: string;
  fournisseur: string;
}

export const stocksService = {
  getByCycle: (cycleId: string) =>
    api.get<Stock[]>(`/cycles/${cycleId}/stocks`).then((r) => r.data),

  create: (cycleId: string, data: CreateStockPayload) =>
    api.post<Stock>(`/stocks`, { ...data, cycle_id: cycleId }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/stocks/${id}`).then((r) => r.data),
};
