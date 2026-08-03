import api from './api';

export interface Client {
  id: string;
  nom: string;
  type_client: 'menage' | 'restaurant' | 'hotel' | 'boucherie' | 'revendeur';
  contact: string | null;
  email: string | null;
  adresse: string | null;
}

export interface CreateClientPayload {
  nom: string;
  type_client: 'menage' | 'restaurant' | 'hotel' | 'boucherie' | 'revendeur';
  contact?: string;
  email?: string;
  adresse?: string;
}

export interface ClientVente {
  id: string;
  cycle_id: string;
  client_id: string | null;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  date: string;
  mode_paiement: string;
  statut_paiement: string;
  cycle?: {
    id: string;
    numero_cycle: number;
    date_reception: string;
    statut: string;
  };
}

export const clientsService = {
  getAll: () =>
    api.get<Client[]>('/clients').then((r) => r.data),

  getById: (id: string) =>
    api.get<Client>(`/clients/${id}`).then((r) => r.data),

  create: (data: CreateClientPayload) =>
    api.post<Client>('/clients', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateClientPayload>) =>
    api.put<Client>(`/clients/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/clients/${id}`).then((r) => r.data),

  getVentes: (id: string) =>
    api.get<ClientVente[]>(`/clients/${id}/ventes`).then((r) => r.data),
};
