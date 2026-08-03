-- ============================================================================
-- AVIPOUL — Schéma PostgreSQL
-- Système de Gestion Intégré — Exploitation Avipoul de Poulets de Chair
-- Basé sur le Cahier des Charges v1.0 et la feuille de route AVIPOUL.md
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Module 0 — Paramétrage & utilisateurs (V0.1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text,
  email text NOT NULL,
  telephone text,
  adresse text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'employe', 'comptable'))
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_deleted_at_idx ON users(deleted_at) WHERE deleted_at IS NOT NULL;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Table de paramétrage globale : conçue comme un singleton (une seule ligne
-- "courante" à la fois), mais avec historique conservé pour traçabilité.
CREATE TABLE IF NOT EXISTS parametrages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cout_standard_poussin numeric(10,2) NOT NULL DEFAULT 0,
  prix_vente_standard numeric(10,2) NOT NULL DEFAULT 0,
  seuil_mortalite_critique_pct numeric(5,2) NOT NULL DEFAULT 5.00,
  seuil_stock_bas_jours integer NOT NULL DEFAULT 3,
  duree_phase_preparation integer NOT NULL DEFAULT 2,
  duree_phase_demarrage integer NOT NULL DEFAULT 7,
  duree_phase_croissance integer NOT NULL DEFAULT 21,
  duree_phase_finition integer NOT NULL DEFAULT 7,
  duree_phase_commercialisation integer NOT NULL DEFAULT 7,
  duree_phase_nettoyage integer NOT NULL DEFAULT 2,
  actif boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS parametrages_actif_unique
  ON parametrages(actif) WHERE actif = true;

DROP TRIGGER IF EXISTS parametrages_set_updated_at ON parametrages;
CREATE TRIGGER parametrages_set_updated_at
BEFORE UPDATE ON parametrages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Module 1 — Cycles d'élevage (V0.1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cycle integer NOT NULL,
  date_reception date NOT NULL,
  effectif_initial integer NOT NULL,
  cout_achat_poussins numeric(12,2) NOT NULL DEFAULT 0,
  phase_courante text NOT NULL DEFAULT 'preparation',
  statut text NOT NULL DEFAULT 'en_cours',
  date_cloture date,
  phase_changed_at timestamptz,
  bilan_cout_total numeric(12,2),
  bilan_recettes numeric(12,2),
  bilan_marge numeric(12,2),
  bilan_mortalite_cumulee integer,
  bilan_cout_revient_par_poulet numeric(10,2),
  bilan_seuil_rentabilite numeric(12,2),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cycles_numero_unique UNIQUE (numero_cycle),
  CONSTRAINT cycles_effectif_positive CHECK (effectif_initial > 0),
  CONSTRAINT cycles_phase_check CHECK (phase_courante IN (
    'preparation', 'demarrage', 'croissance', 'finition', 'commercialisation', 'nettoyage'
  )),
  CONSTRAINT cycles_statut_check CHECK (statut IN ('en_cours', 'cloture')),
  CONSTRAINT cycles_cloture_coherente CHECK (
    (statut = 'en_cours' AND date_cloture IS NULL)
    OR (statut = 'cloture' AND date_cloture IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS cycles_statut_idx ON cycles(statut);
CREATE INDEX IF NOT EXISTS cycles_date_reception_idx ON cycles(date_reception DESC);

DROP TRIGGER IF EXISTS cycles_set_updated_at ON cycles;
CREATE TRIGGER cycles_set_updated_at
BEFORE UPDATE ON cycles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Historique des changements de phase, pour calculer automatiquement la
-- durée écoulée par phase (exigence 5.1).
CREATE TABLE IF NOT EXISTS cycle_phases_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  phase text NOT NULL,
  date_debut timestamptz NOT NULL DEFAULT now(),
  date_fin timestamptz,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT cycle_phases_phase_check CHECK (phase IN (
    'preparation', 'demarrage', 'croissance', 'finition', 'commercialisation', 'nettoyage'
  ))
);

CREATE INDEX IF NOT EXISTS cycle_phases_historique_cycle_idx
  ON cycle_phases_historique(cycle_id, date_debut DESC);

-- ============================================================================
-- Module 2 — Gestion des stocks (V0.1 / V0.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mouvements_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  type_stock text NOT NULL,
  sens text NOT NULL,
  quantite numeric(12,3) NOT NULL,
  unite text NOT NULL DEFAULT 'kg',
  cout numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  fournisseur text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  valide_le timestamptz,
  valide_par uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mouvements_stock_type_check CHECK (type_stock IN ('aliment', 'vaccin', 'litiere')),
  CONSTRAINT mouvements_stock_sens_check CHECK (sens IN ('entree', 'sortie')),
  CONSTRAINT mouvements_stock_quantite_positive CHECK (quantite > 0)
);

CREATE INDEX IF NOT EXISTS mouvements_stock_cycle_idx ON mouvements_stock(cycle_id, date DESC);
CREATE INDEX IF NOT EXISTS mouvements_stock_type_idx ON mouvements_stock(type_stock);

-- Produits vétérinaires suivis individuellement (péremption, seuils de
-- rupture) — complète mouvements_stock pour le suivi détaillé de la V0.4.
CREATE TABLE IF NOT EXISTS produits_veterinaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_produit text NOT NULL DEFAULT 'vaccin',
  quantite_stock numeric(12,3) NOT NULL DEFAULT 0,
  unite text NOT NULL DEFAULT 'dose',
  seuil_alerte numeric(12,3) NOT NULL DEFAULT 0,
  date_peremption date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT produits_veterinaires_type_check CHECK (type_produit IN ('vaccin', 'antibiotique', 'vitamine', 'autre'))
);

CREATE INDEX IF NOT EXISTS produits_veterinaires_peremption_idx
  ON produits_veterinaires(date_peremption) WHERE date_peremption IS NOT NULL;

DROP TRIGGER IF EXISTS produits_veterinaires_set_updated_at ON produits_veterinaires;
CREATE TRIGGER produits_veterinaires_set_updated_at
BEFORE UPDATE ON produits_veterinaires
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Module 3 — Suivi sanitaire (V0.1 / V0.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mortalites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  nombre integer NOT NULL,
  cause text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  valide_le timestamptz,
  valide_par uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mortalites_nombre_positive CHECK (nombre > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS mortalites_cycle_date_unique ON mortalites(cycle_id, date);
CREATE INDEX IF NOT EXISTS mortalites_cycle_idx ON mortalites(cycle_id, date DESC);

CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  produit_id uuid REFERENCES produits_veterinaires(id) ON DELETE SET NULL,
  produit text NOT NULL,
  date_prevue date NOT NULL,
  date_realisee date,
  rappel boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vaccinations_cycle_idx ON vaccinations(cycle_id);
CREATE INDEX IF NOT EXISTS vaccinations_date_prevue_idx
  ON vaccinations(date_prevue) WHERE date_realisee IS NULL;

DROP TRIGGER IF EXISTS vaccinations_set_updated_at ON vaccinations;
CREATE TRIGGER vaccinations_set_updated_at
BEFORE UPDATE ON vaccinations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Module 4 — Gestion financière (V0.2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS depenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  categorie text NOT NULL,
  montant numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT current_date,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT depenses_categorie_check CHECK (categorie IN (
    'poussins', 'aliments', 'veterinaire', 'infrastructure', 'imprevu'
  )),
  CONSTRAINT depenses_montant_positive CHECK (montant > 0)
);

CREATE INDEX IF NOT EXISTS depenses_cycle_idx ON depenses(cycle_id, date DESC);
CREATE INDEX IF NOT EXISTS depenses_categorie_idx ON depenses(categorie);

-- Mouvements de trésorerie (encaissements, réinvestissements) — support de
-- l'exigence 5.4 "suivi de la trésorerie disponible et du montant réinvesti".
CREATE TABLE IF NOT EXISTS mouvements_tresorerie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES cycles(id) ON DELETE SET NULL,
  type_mouvement text NOT NULL,
  montant numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT current_date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mouvements_tresorerie_type_check CHECK (type_mouvement IN (
    'encaissement_vente', 'reinvestissement', 'depense', 'apport', 'retrait'
  ))
);

CREATE INDEX IF NOT EXISTS mouvements_tresorerie_date_idx ON mouvements_tresorerie(date DESC);
CREATE INDEX IF NOT EXISTS mouvements_tresorerie_cycle_idx ON mouvements_tresorerie(cycle_id);

-- ============================================================================
-- Module 5 — Ventes et clients (V0.2 / V0.3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_client text NOT NULL DEFAULT 'menage',
  email text,
  contact text,
  adresse text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT clients_type_check CHECK (type_client IN (
    'menage', 'restaurant', 'hotel', 'boucherie', 'revendeur'
  ))
);

CREATE INDEX IF NOT EXISTS clients_type_idx ON clients(type_client);
CREATE INDEX IF NOT EXISTS clients_deleted_at_idx ON clients(deleted_at) WHERE deleted_at IS NOT NULL;

DROP TRIGGER IF EXISTS clients_set_updated_at ON clients;
CREATE TRIGGER clients_set_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS ventes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  quantite integer NOT NULL,
  prix_unitaire numeric(10,2) NOT NULL,
  montant_total numeric(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  categorie_produit text NOT NULL DEFAULT 'poulet_vif',
  remise numeric(10,2) DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  mode_paiement text NOT NULL DEFAULT 'especes',
  statut_paiement text NOT NULL DEFAULT 'paye',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  valide_le timestamptz,
  valide_par uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ventes_quantite_positive CHECK (quantite > 0),
  CONSTRAINT ventes_prix_positive CHECK (prix_unitaire > 0),
  CONSTRAINT ventes_categorie_produit_check CHECK (categorie_produit IN (
    'poulet_vif',
    'poulet_abattu',
    'poulet_entier',
    'poulet_fermier',
    'poulet_morceaux',
    'poulet_cuisse',
    'poulet_ailes'
  )),
  CONSTRAINT ventes_mode_paiement_check CHECK (mode_paiement IN (
    'especes', 'mobile_money', 'virement', 'cheque', 'credit'
  )),
  CONSTRAINT ventes_statut_paiement_check CHECK (statut_paiement IN (
    'paye', 'partiel', 'impaye'
  ))
);

CREATE INDEX IF NOT EXISTS ventes_cycle_idx ON ventes(cycle_id, date DESC);
CREATE INDEX IF NOT EXISTS ventes_client_idx ON ventes(client_id);
CREATE INDEX IF NOT EXISTS ventes_categorie_produit_idx ON ventes(categorie_produit);
CREATE INDEX IF NOT EXISTS ventes_statut_paiement_idx
  ON ventes(statut_paiement) WHERE statut_paiement <> 'paye';

DROP TRIGGER IF EXISTS ventes_set_updated_at ON ventes;
CREATE TRIGGER ventes_set_updated_at
BEFORE UPDATE ON ventes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Règlements partiels sur une vente à crédit — support du suivi des
-- impayés/créances (exigence 5.5).
CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vente_id uuid NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  montant numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT current_date,
  mode_paiement text NOT NULL DEFAULT 'especes',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT paiements_montant_positive CHECK (montant > 0)
);

CREATE INDEX IF NOT EXISTS paiements_vente_idx ON paiements(vente_id, date);

-- ============================================================================
-- Module 6 — Gestion des risques & alertes (V0.4)
-- ============================================================================

-- Configuration des remises par type de client et par volume
CREATE TABLE IF NOT EXISTS remises_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_client text,
  seuil_min_quantite integer,
  seuil_max_quantite integer,
  remise_pct numeric(5,2) NOT NULL DEFAULT 0,
  mode_remise text CHECK (mode_remise IN ('type_client', 'volume', 'aucun')),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT remises_type_client_check CHECK (type_client IN (
    'menage', 'restaurant', 'hotel', 'boucherie', 'revendeur'
  )),
  CONSTRAINT remises_seuil_coherent CHECK (
    (seuil_min_quantite IS NULL AND seuil_max_quantite IS NULL) OR
    (seuil_min_quantite IS NOT NULL AND seuil_max_quantite IS NOT NULL AND seuil_min_quantite <= seuil_max_quantite)
  )
);

CREATE INDEX IF NOT EXISTS remises_type_client_idx ON remises_configuration(type_client) WHERE actif = true;
CREATE INDEX IF NOT EXISTS remises_volume_idx ON remises_configuration(seuil_min_quantite, seuil_max_quantite) WHERE actif = true;

DROP TRIGGER IF EXISTS remises_set_updated_at ON remises_configuration;
CREATE TRIGGER remises_set_updated_at
BEFORE UPDATE ON remises_configuration
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Module 6 — Gestion des risques & alertes (V0.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS risques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie text NOT NULL,
  description text NOT NULL,
  mesure_preventive text,
  seuil_alerte text,
  actif boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risques_categorie_check CHECK (categorie IN (
    'sanitaire', 'financier', 'marche', 'approvisionnement'
  ))
);

CREATE INDEX IF NOT EXISTS risques_categorie_idx ON risques(categorie);
CREATE INDEX IF NOT EXISTS risques_actif_idx ON risques(actif) WHERE actif = true;

DROP TRIGGER IF EXISTS risques_set_updated_at ON risques;
CREATE TRIGGER risques_set_updated_at
BEFORE UPDATE ON risques
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Journal des alertes déclenchées automatiquement (stock bas, mortalité
-- anormale, risque actif) — alimente le tableau de bord (module 7).
CREATE TABLE IF NOT EXISTS alertes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_alerte text NOT NULL,
  niveau text NOT NULL DEFAULT 'warning',
  cycle_id uuid REFERENCES cycles(id) ON DELETE CASCADE,
  risque_id uuid REFERENCES risques(id) ON DELETE SET NULL,
  produit_veterinaire_id uuid REFERENCES produits_veterinaires(id) ON DELETE SET NULL,
  message text NOT NULL,
  resolue boolean NOT NULL DEFAULT false,
  resolue_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alertes_type_check CHECK (type_alerte IN (
    'stock_bas', 'mortalite_anormale', 'risque', 'peremption_produit'
  )),
  CONSTRAINT alertes_niveau_check CHECK (niveau IN ('info', 'warning', 'critical'))
);

CREATE INDEX IF NOT EXISTS alertes_cycle_idx ON alertes(cycle_id);
CREATE INDEX IF NOT EXISTS alertes_non_resolues_idx ON alertes(resolue, created_at DESC) WHERE resolue = false;
CREATE INDEX IF NOT EXISTS alertes_type_idx ON alertes(type_alerte);

-- ============================================================================
-- Module 7 — Rapports & factures (V1.0, générés via le service Python)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rapports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_rapport text NOT NULL,
  cycle_id uuid REFERENCES cycles(id) ON DELETE CASCADE,
  format text NOT NULL DEFAULT 'pdf',
  fichier_path text,
  genere_by uuid REFERENCES users(id) ON DELETE SET NULL,
  genere_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rapports_type_check CHECK (type_rapport IN ('bilan_cycle', 'comparatif_cycles', 'export_brut')),
  CONSTRAINT rapports_format_check CHECK (format IN ('pdf', 'csv'))
);

CREATE INDEX IF NOT EXISTS rapports_cycle_idx ON rapports(cycle_id);
CREATE INDEX IF NOT EXISTS rapports_type_idx ON rapports(type_rapport);

CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vente_id uuid NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  numero_facture text NOT NULL,
  fichier_path text,
  genere_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT factures_numero_unique UNIQUE (numero_facture),
  CONSTRAINT factures_vente_unique UNIQUE (vente_id)
);

CREATE INDEX IF NOT EXISTS factures_vente_idx ON factures(vente_id);

-- ============================================================================
-- Vues utilitaires
-- ============================================================================

-- Effectif vivant en temps réel par cycle (exigence 5.2 / tableau de bord).
CREATE OR REPLACE VIEW v_cycles_effectif_vivant AS
SELECT
  c.id AS cycle_id,
  c.effectif_initial,
  COALESCE(SUM(m.nombre), 0) AS mortalite_cumulee,
  c.effectif_initial - COALESCE(SUM(m.nombre), 0) AS effectif_vivant,
  ROUND(
    COALESCE(SUM(m.nombre), 0)::numeric / NULLIF(c.effectif_initial, 0) * 100, 2
  ) AS taux_mortalite_pct
FROM cycles c
LEFT JOIN mortalites m ON m.cycle_id = c.id
GROUP BY c.id, c.effectif_initial;

-- Trésorerie et rentabilité en temps réel par cycle (module 7 — tableau de bord).
CREATE OR REPLACE VIEW v_cycles_finances AS
SELECT
  c.id AS cycle_id,
  c.cout_achat_poussins
    + COALESCE((SELECT SUM(d.montant) FROM depenses d WHERE d.cycle_id = c.id), 0) AS cout_total,
  COALESCE((SELECT SUM(v.montant_total) FROM ventes v WHERE v.cycle_id = c.id), 0) AS recettes_total,
  COALESCE((SELECT SUM(v.montant_total) FROM ventes v WHERE v.cycle_id = c.id), 0)
    - (c.cout_achat_poussins
       + COALESCE((SELECT SUM(d.montant) FROM depenses d WHERE d.cycle_id = c.id), 0)) AS marge
FROM cycles c;

-- ============================================================================
-- Fin du schéma
-- ============================================================================