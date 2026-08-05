import api from './api';
import { downloadProgress } from './downloadProgress';

export interface Cycle {
  id: string;
  numero_cycle: string;
  date_reception: string;
  effectif_initial: number;
  effectif_actuel: number;
  cout_achat_poussins: number;
  phase_courante: string;
  statut: 'en_cours' | 'cloture';
  cout_total?: number;
  mortalite_cumulee?: number;
  taux_mortalite_pct?: number;
  date_cloture?: string | null;
  bilan_cout_total?: number | null;
  bilan_recettes?: number | null;
  bilan_marge?: number | null;
  bilan_mortalite_cumulee?: number | null;
  bilan_cout_revient_par_poulet?: number | null;
  bilan_seuil_rentabilite?: number | null;
  created_at: string;
  updated_at: string;
  cree_par?: { id: string; nom: string; photo?: string };
}

export interface CreateCyclePayload {
  numero_cycle: string;
  date_reception: string;
  effectif_initial: number;
  cout_achat_poussins: number;
}

export interface VerificationCloture {
  cycle_id: string;
  numero_cycle: number;
  statut: string;
  cloturable: boolean;
  en_attente: { code: string; label: string; count: number }[];
  recommandations: { code: string; label: string; count: number }[];
  effectif: {
    initial: number;
    morts: number;
    vivant: number;
    taux_mortalite_pct: number;
  };
  ventes: {
    total: number;
    validees: number;
    non_validees: number;
    impayees: number;
  };
  sorties_stock: {
    total: number;
    validees: number;
    non_validees: number;
  };
  mortalites: {
    total: number;
    validees: number;
    non_validees: number;
  };
  finances: {
    cout_total: number;
    total_ventes: number;
    marge: number;
    cout_revient_par_poulet: number;
    seuil_rentabilite: number;
  };
}

export const cyclesService = {
  getAll: () => api.get<Cycle[]>('/cycles').then((r) => r.data),

  getById: (id: string) =>
    api.get<Cycle>(`/cycles/${id}`).then((r) => r.data),

  create: (data: CreateCyclePayload) =>
    api.post<Cycle>('/cycles', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCyclePayload>) =>
    api.patch<Cycle>(`/cycles/${id}`, data).then((r) => r.data),

  changePhase: (id: string, phase_courante: string) =>
    api.patch<Cycle>(`/cycles/${id}/phase`, { phase: phase_courante }).then((r) => r.data),

  verificationCloture: (id: string) =>
    api.get<VerificationCloture>(`/cycles/${id}/verification-cloture`).then((r) => r.data),

  cloture: (id: string) =>
    api.post<Cycle>(`/cycles/${id}/cloture`).then((r) => r.data),

  getFinances: (id: string) =>
    api.get(`/cycles/${id}/finances`).then((r) => r.data),

  exportPdf: (id: string, onProgress?: (percent: number) => void) =>
    api.get(`/rapports/cycle/${id}/pdf`, {
      responseType: 'blob',
      onDownloadProgress: downloadProgress(onProgress),
    }),
};
