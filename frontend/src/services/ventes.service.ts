import api from './api';

export type CategorieProduit = 'poulet_vif' | 'poulet_abattu' | 'poulet_entier' | 'poulet_fermier' | 'poulet_morceaux' | 'poulet_cuisse' | 'poulet_ailes';

export const CATEGORIE_PRODUIT_LABELS: Record<CategorieProduit, string> = {
  poulet_vif: 'Poulet vif',
  poulet_abattu: 'Poulet abattu',
  poulet_entier: 'Poulet entier',
  poulet_fermier: 'Poulet fermier',
  poulet_morceaux: 'Poulet en morceaux',
  poulet_cuisse: 'Cuisses de poulet',
  poulet_ailes: 'Ailes de poulet',
};

export interface Vente {
  id: string;
  cycle_id: string;
  client_id: string | null;
  quantite: number;
  prix_unitaire: number;
  date: string;
  mode_paiement: 'especes' | 'mobile_money' | 'virement' | 'cheque' | 'credit';
  statut_paiement: 'paye' | 'partiel' | 'impaye';
  categorie_produit: CategorieProduit;
  remise: number;
  client?: { id: string; nom: string; type_client: string };
  creator?: { id: string; nom: string; prenom: string };
}

export interface CreateVentePayload {
  cycle_id: string;
  client_id?: string;
  quantite: number;
  prix_unitaire: number;
  date: string;
  mode_paiement: 'especes' | 'mobile_money' | 'virement' | 'cheque' | 'credit';
  statut_paiement: 'paye' | 'partiel' | 'impaye';
  categorie_produit: CategorieProduit;
}

export interface FinancesData {
  cycle_id: string;
  numero_cycle: number;
  cout_total: number;
  total_ventes: number;
  marge: number;
  cout_revient_par_poulet: number;
  seuil_rentabilite: number;
  effectif_vivant: number;
}

export const ventesService = {
  getByCycle: (cycleId: string) =>
    api.get<Vente[]>(`/cycles/${cycleId}/ventes`).then((r) => r.data),

  getById: (id: string) =>
    api.get<Vente>(`/ventes/${id}`).then((r) => r.data),

  getAll: () =>
    api.get<Vente[]>('/ventes').then((r) => r.data),

  create: (data: CreateVentePayload) =>
    api.post<Vente>('/ventes', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateVentePayload>) =>
    api.put<Vente>(`/ventes/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/ventes/${id}`).then((r) => r.data),

  exportFacturePdf: (venteId: string) =>
    api.get(`/rapports/facture/${venteId}/pdf`, { responseType: 'blob' }),

  exportFactureHtml: (venteId: string) =>
    api.get(`/rapports/facture/${venteId}/html`, { responseType: 'text' }),

  exportFactureGroupeePdf: (clientId: string, cycleId: string) =>
    api.get(`/rapports/facture-groupee/${clientId}/${cycleId}/pdf`, { responseType: 'blob' }),

  exportFactureGroupeeHtml: (clientId: string, cycleId: string) =>
    api.get(`/rapports/facture-groupee/${clientId}/${cycleId}/html`, { responseType: 'text' }),
};
