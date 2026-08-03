import api from './api';

export interface Mortalite {
  id: string;
  cycleId: string;
  date: string;
  nombre: number;
  cause: string;
  created_at: string;
  creator?: { id: string; nom: string; prenom: string };
}

export interface CreateMortalitePayload {
  date: string;
  nombre: number;
  cause: string;
}

export const santeService = {
  getByCycle: (cycleId: string) =>
    api.get<{ mortalites: Mortalite[]; resume: unknown }>(`/cycles/${cycleId}/mortalites`).then((r) => r.data.mortalites || []),

  create: (cycleId: string, data: CreateMortalitePayload) =>
    api.post<Mortalite>(`/mortalites`, { ...data, cycle_id: cycleId }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/mortalites/${id}`).then((r) => r.data),
};
