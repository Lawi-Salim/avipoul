import api from './api';

export interface Depense {
  id: string;
  cycle_id: string;
  categorie: 'poussins' | 'aliments' | 'veterinaire' | 'infrastructure' | 'imprevu';
  montant: number;
  date: string;
  description: string | null;
  creator?: { id: string; nom: string; prenom: string };
}

export interface CreateDepensePayload {
  cycle_id: string;
  categorie: 'poussins' | 'aliments' | 'veterinaire' | 'infrastructure' | 'imprevu';
  montant: number;
  date: string;
  description?: string;
}

export const depensesService = {
  getByCycle: (cycleId: string) =>
    api.get<Depense[]>(`/cycles/${cycleId}/depenses`).then((r) => r.data),

  create: (data: CreateDepensePayload) =>
    api.post<Depense>('/depenses', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateDepensePayload>) =>
    api.put<Depense>(`/depenses/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/depenses/${id}`).then((r) => r.data),
};
