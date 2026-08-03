import api from './api';

export interface Risque {
  id: string;
  categorie: 'sanitaire' | 'financier' | 'marche' | 'approvisionnement';
  description: string;
  mesure_preventive: string | null;
  seuil_alerte: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
  creator?: { id: string; nom: string; prenom: string };
}

export interface CreateRisquePayload {
  categorie: string;
  description: string;
  mesure_preventive?: string;
  seuil_alerte?: string;
  actif?: boolean;
}

export const risquesService = {
  getAll: () =>
    api.get<Risque[]>('/risques').then((r) => r.data),

  getActifs: () =>
    api.get<Risque[]>('/risques/actifs').then((r) => r.data),

  getById: (id: string) =>
    api.get<Risque>(`/risques/${id}`).then((r) => r.data),

  create: (data: CreateRisquePayload) =>
    api.post<Risque>('/risques', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateRisquePayload>) =>
    api.put<Risque>(`/risques/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/risques/${id}`).then((r) => r.data),
};
