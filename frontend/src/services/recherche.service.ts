import api from './api';

export interface RechercheClient {
  id: string;
  nom: string;
  type_client: string;
  contact: string | null;
  adresse: string | null;
}

export interface RechercheCycle {
  id: string;
  numero_cycle: number;
  statut: string;
  date_reception: string;
}

export interface RechercheProduit {
  id: string;
  nom: string;
  type_produit: string;
  quantite_stock: number;
  unite: string;
}

export interface RechercheUtilisateur {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface RechercheVente {
  id: string;
  date: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  mode_paiement: string;
  statut_paiement: string;
  categorie_produit: string;
  cycle_id: string;
  client: { id: string; nom: string; type_client: string } | null;
  cycle: { id: string; numero_cycle: number } | null;
}

export interface RechercheDepense {
  id: string;
  categorie: string;
  montant: number;
  date: string;
  description: string | null;
  cycle_id: string;
  cycle: { id: string; numero_cycle: number } | null;
}

export interface RechercheResultats {
  clients: RechercheClient[];
  cycles: RechercheCycle[];
  produits: RechercheProduit[];
  utilisateurs: RechercheUtilisateur[];
  ventes: RechercheVente[];
  depenses: RechercheDepense[];
}

export const rechercheService = {
  rechercher: (q: string) =>
    api
      .get<RechercheResultats>('/recherche', { params: { q } })
      .then((r) => r.data),
};
