# AVIPOUL — Guide de développement

> Système de Gestion Intégré — Exploitation Avipoul de Poulets de Chair
> Porteur du projet : Dahlawi Ibrahim Salim (Lawi Ibrahim) · Union des Comores
> Basé sur le Cahier des Charges v1.0 (07-07-2026)

Ce document est un guide opérationnel : il traduit le cahier des charges en un
plan de développement concret, découpé en versions livrables. Coche les
cases au fur et à mesure. Chaque version doit être **utilisable en
production** avant de passer à la suivante — ne pas construire V0.2 sur une
V0.1 qui ne tourne pas encore réellement sur un cycle.

---

## 0. Principes directeurs

- **Un cycle réel avant tout.** L'objectif n°1 de la V0.1 est de remplacer le
  tableur pour un cycle complet, pas d'avoir une belle architecture.
- **Pas de sur-ingénierie.** Hébergement léger, stack simple, une seule
  personne doit pouvoir tout maintenir seule.
- **Français partout** (UI, messages d'erreur, documentation).
- **Penser multi-utilisateur et offline dès le modèle de données**, même si
  on ne les implémente pas tout de suite (cf. exigences non fonctionnelles).
- **Chaque version se termine par un test réel** : Lawi doit pouvoir faire
  tourner un cycle avec de vraies données avant de continuer.

---

## 1. Stack technique

Stack confirmée pour le projet :

| Couche | Choix | Pourquoi / notes |
|---|---|---|
| Frontend | React + Vite + TypeScript | Build rapide, typage fort utile vu le nombre d'entités liées (Cycle, Stock, Ventes...) |
| UI | Chakra UI | Composants accessibles prêts à l'emploi — idéal pour aller vite sur des écrans de saisie terrain |
| Backend | Node.js + NestJS + TypeScript | Architecture modulaire (module/controller/service par domaine métier) — s'aligne naturellement avec le découpage par version du cahier des charges et facilite le passage au multi-utilisateur (V1.0) |
| ORM | Sequelize (via `@nestjs/sequelize`) | Migrations + modèles, mapping direct avec le schéma `schema-avipoul.sql` (section 2) |
| Base de données | PostgreSQL | Fiable, gère bien les historiques/cycles, prêt pour le multi-utilisateur (V1.0) |
| Génération PDF / factures | Python (script ou micro-service séparé, ex. `reportlab`/`weasyprint`) | Appelé uniquement pour les rapports de cycle (module 9) et les factures de vente — pas de logique métier côté Python |
| Auth | JWT ou session + bcrypt | Suffisant pour 1 à quelques utilisateurs (évolutif en V1.0) |
| Hébergement | VPS low-cost ou Railway/Render/Fly.io | Coût maîtrisé, auto-financement |
| Sauvegardes | Dump PostgreSQL quotidien (cron) vers stockage externe | Exigence de fiabilité — pas de perte de données |

**Frontière Node/Python :** tout le métier (cycles, stocks, calculs, alertes)
reste dans le backend NestJS/Sequelize. Le service Python n'est appelé que
pour transformer des données déjà calculées en PDF (rapport de cycle,
facture) — soit via un appel HTTP interne à un petit service Flask/FastAPI,
soit via un script invoqué en sous-processus depuis un `RapportsService`
Nest dédié. Ça évite de dupliquer la logique métier dans deux langages.

**Pourquoi NestJS plutôt qu'Express nu :** chaque module Nest (`cycles`,
`stocks`, `sante`, `finances`, `ventes`, `risques`) correspond à peu près à
un module du cahier des charges (section 3). Les `Guards` gèrent
l'authentification/les rôles (admin/employé/comptable) de façon centralisée,
ce qui colle directement à l'exigence de sécurité (section 6) et au
multi-utilisateur de la V1.0.

---

## 2. Modèle de données (vue d'ensemble)

Le schéma complet est défini dans **`schema-avipoul.sql`** (PostgreSQL,
18 tables organisées par module, avec contraintes, index et deux vues
utilitaires `v_cycles_effectif_vivant` et `v_cycles_finances`). Ce fichier
est la référence à partir de laquelle les modèles Sequelize (`@nestjs/sequelize`,
`backend/src/**/entities/*.entity.ts`) doivent être écrits — ne pas
laisser le schéma dériver entre le `.sql` et les entités Nest.

Entités centrales à créer dès la V0.1, même si certains champs restent vides
jusqu'à des versions ultérieures. Les mettre en place tôt évite une refonte.

```
User
 ├─ id, nom, email, mot_de_passe_hash, role (admin | employe | comptable)

Cycle
 ├─ id, date_reception, effectif_initial, cout_achat_poussins
 ├─ phase_courante (preparation | demarrage | croissance | finition | commercialisation | nettoyage)
 ├─ statut (en_cours | cloture)
 ├─ date_cloture, bilan_cout_total, bilan_recettes, bilan_marge, bilan_mortalite_cumulee

MouvementStock
 ├─ id, cycle_id, type (aliment | vaccin | litiere), sens (entree | sortie)
 ├─ quantite, cout, date, fournisseur

Mortalite
 ├─ id, cycle_id, date, nombre, cause (nullable)

Vaccination
 ├─ id, cycle_id, produit, date_prevue, date_realisee (nullable), rappel

Depense
 ├─ id, cycle_id, categorie (poussins | aliments | veterinaire | infrastructure | imprevu)
 ├─ montant, date, description

Vente
 ├─ id, cycle_id, client_id (nullable en V0.1/V0.2), quantite, prix_unitaire, date, mode_paiement, statut_paiement

Client
 ├─ id, nom, type (menage | restaurant | hotel | boucherie | revendeur), contact

Risque
 ├─ id, categorie (sanitaire | financier | marche | approvisionnement)
 ├─ description, mesure_preventive, seuil_alerte, actif

ParametrageGlobal
 ├─ cout_standard_par_poussin, prix_vente_standard, seuil_mortalite_critique, seuil_stock_bas
```

**Relation clé** : tout (`MouvementStock`, `Mortalite`, `Depense`, `Vente`)
est rattaché à un `Cycle`. C'est le pivot de tout le système — le cahier des
charges le dit explicitement : sans cycle, rien d'autre n'a de sens.

---

## 3. Feuille de route par version

### V0.1 — MVP : « faire tourner un cycle complet »
**Objectif :** gérer un cycle d'élevage de bout en bout, même basique.

- [ ] Squelette repo : backend (Nest CLI + TS + `@nestjs/sequelize`), frontend (Vite + React + TS + Chakra), connexion PostgreSQL
- [ ] Exécuter `schema-avipoul.sql` sur la base PostgreSQL locale (bootstrap du schéma)
- [ ] Authentification simple (1 utilisateur admin) via module `auth` (Guard + stratégie JWT)
- [ ] Modules Nest + entités Sequelize (`users`, `cycles`, `mouvements_stock`, `mortalites`, `parametrages`)
- [ ] Écran Paramétrage minimal : coûts standards, prix de vente
- [ ] Création d'un cycle (date réception, effectif initial, coût d'achat)
- [ ] Suivi des phases du cycle (changement manuel de statut)
- [ ] Clôture de cycle avec bilan basique (coût total, mortalité cumulée)
- [ ] Stocks aliments : entrées/sorties (quantité, coût, date, fournisseur)
- [ ] Saisie mortalité quotidienne + calcul automatique du taux
- [ ] **Test de validation :** faire tourner un cycle réel de A à Z avec de vraies données

### V0.2 — Rentabilité réelle
**Objectif :** savoir si un cycle est rentable.

- [ ] Modèle `Depense` + écran d'enregistrement par catégorie
- [ ] Modèle `Vente` basique (quantité, prix, date — sans fiche client détaillée)
- [ ] Calcul automatique : coût de revient/poulet
- [ ] Calcul automatique : marge bénéficiaire
- [ ] Calcul automatique : seuil de rentabilité
- [ ] Bilan de clôture de cycle enrichi (coût total, recettes, marge)
- [ ] **Test de validation :** clôturer un cycle et vérifier manuellement que les calculs correspondent à un calcul tableur de contrôle

### V0.3 — Clients et vision globale
**Objectif :** structurer la relation commerciale et avoir une vue d'ensemble.

- [ ] Modèle `Client` complet (type, contact)
- [ ] Historique des ventes par client
- [ ] Lier `Vente` à `Client`
- [ ] Tableau de bord : vue synthétique du cycle en cours (effectif vivant, mortalité cumulée, trésorerie, marge estimée)
- [ ] Tableau de bord : comparatif entre cycles précédents
- [ ] **Test de validation :** avec 2 cycles clôturés en base, le dashboard affiche un comparatif cohérent

### V0.4 — Anticipation et fiabilité
**Objectif :** passer d'un outil réactif à un outil qui alerte.

- [ ] Alerte automatique stock bas (aliment/vaccin) selon seuil paramétrable
- [ ] Alerte automatique mortalité anormale selon seuil paramétrable
- [ ] Modèle `Risque` + écran journal des risques + mesures préventives
- [ ] Modèle `Vaccination` complet (calendrier, rappels, dates de péremption des produits)
- [ ] **Test de validation :** simuler un stock sous le seuil et une mortalité excessive, vérifier le déclenchement des alertes

### V1.0 — Consolidation
**Objectif :** rendre le système prêt pour la durée et pour plusieurs personnes.

### Plans d'actions par phase : 
1. *Rôle et permissions (fondation)* ✅
  - **Guards par rôle** : Créer `RolesGuard` (admin/employé/comptable) dans `auth/`
  - **Décorateur les rôles** : `@Roles('admin)` pour protéger les contrôleurs
  - **Appliquer les guards** : Sécuriser les modules sensibles (paramétrages, finances, suppression)
  - **Écran de gestion utilisateurs** : CRUD utilisateurs avec attribution de rôle (frontend + backend)

2. *Service PDF (rapport de cycle)* ✅
  - **Compléter `main.py`** : Endpoint `/rapport-cycle` avec template HTML
  - **Template rapport cycle** : Créer `templates/cycle-rapport.html` avec données du cycle
  - **Module backend `rapports/`** : Service qui appelle le PDF-service via HTTP
  - **Bouton "Exporter PDF"** : Sur la page de détail d'un cycle cloturé

3. *Service PDF (factures)* ✅
  - **Endpoint `/facture` dans `pdf-service`** : Template facture de vente
  - **Template facture** : `pdf-service/templates/invoice.html` existe déjà à compléter
  - **Intégration ventes** : Bouton "Générer facture PDF" sur chaque vente
  - **Système de remises** : Configuration par type de client et volume, mode de sélection, calcul automatique, intégration ventes et factures

4. *Exports CSV* ✅
  - **Endpoint export cycles** : `/export/cycles` → CSV multi-cycles comparatif
  - **Endpoint export clients** : `/export/clients` → CSV liste clients
  - **Endpoint export ventes** : `/export/ventes` → CSV liste ventes
  - **Endpoint export données brutes** : `/export/donnees-brute` → dump CSV complet
  - **Boutons d'export** : Ajouter sur les pages correspondantes (Dashboard, Clients)

5. *Mobile et offline* ⌛
  - **Audit et responsive** : Tester et corriger l'affichage mobile des pages de saisie ✅
  - **Saisie rapide terrain** : Mode compact pour Stocks, Mortalité, Ventes ✅
  - **Prototype offline** : Étude de faisabilité (Service Worker + IndexedDB + sync queue) ⌛

6. *Sauvegarde* ⌛
  - **Script backup automatique** : Cron PostgreSQL dump vers stockage externe
  - **Script restauration** : Script testé de restore depuis le dump
  - **Test restauration** : Restaurer un dump et vérifier l'intégrité des données

7. *Validation finale* ⌛
  - **Test de montée en charge** : 2 utilisateurs simultanés, plusieurs cycles
  - **Vérification cohérence** : Données restent intactes après charge

#### Phase 1  — ✅ Complète
*Phase 1 bien implémentée :*
  - ✅ `roles.decorator.ts` créé avec décorateur `@Roles()`
  - ✅ `roles.guard.ts` créé avec vérification des rôles et 403 Forbidden
  - ✅ `utilisateurs.controller.ts` sécurisé avec `@Roles('admin')` et guards
  - ✅ `auth.service.ts` avec méthodes CRUD complètes (findAll, findOne, update, toggleActif, remove)
  - ✅ Page frontend `Utilisateurs.tsx` complète avec tableau, formulaire création/modification, toggle actif, suppression
  - ✅ Contrôleurs sensibles sécurisés : parametrages, finances, clients, cycles avec décorateurs `@Roles`

#### Phase 2  — ✅ Complète
*Phase 2 parfaitement implémentée :*
  - ✅ Template HTML `cycle-report.html` (618 lignes) — Design professionnel avec sections : infos cycle, mortalité (barre visuelle), dépenses (tableau + graphique barres), ventes, bilan financier (cartes + graphique)
  - ✅ Service Python `main.py` — Endpoint `/rapport-cycle` fonctionnel avec Jinja2 + WeasyPrint
  - ✅ Module NestJS `rapports/` — Service (récupère données, appelle Python), Contrôleur (`GET /rapports/cycle/:id/pdf`), Module (imports corrects)
  - ✅ Intégration backend — RapportsModule ajouté dans app.module.ts
  - ✅ Frontend — Bouton export PDF dans CycleDetail.tsx (visible si cycle clôturé), méthode handleExportPdf, service cyclesService.exportPdf

#### Phase 3 — ✅ Complète
*Phase 3 parfaitement implémentée :*
  - ✅ Template HTML `invoice.html` — Variables Jinja2 pour en-tête, client, métadonnées, articles et totaux
  - ✅ Service Python `main.py` — Endpoints POST `/facture` (PDF WeasyPrint) et `/facture-html` (preview)
  - ✅ NestJS Backend `rapports.controller.ts` — `buildFacturePayload(venteId)` avec SQL LEFT JOIN
  - ✅ Logique de facturation — Format `FAC-YYYYMM-XXXXXX`, échéance J+7 ("7 jours net")
  - ✅ Endpoints Backend — `GET /rapports/facture/:id/pdf` et `/html` avec gestion erreurs 404/503
  - ✅ Frontend React — Bouton "Générer facture" (FiDownload) dans `Ventes.tsx`
  - ✅ Système de remises — Configuration par type de client et volume, mode de sélection, intégration ventes et factures
    - ✅ Migration SQL `remises_configuration` : table avec types de client et paliers de volume
    - ✅ Migration SQL `mode_remise` : colonne pour sélectionner le mode actif (type_client | volume | aucun)
    - ✅ Backend entity `RemiseConfiguration` : mapping Sequelize avec champs type_client, seuils, remise_pct, actif
    - ✅ Backend `RemisesService` : méthodes CRUD, calculateRemise(), getRemiseMode(), setRemiseMode()
    - ✅ Backend `RemisesController` : endpoints sécurisés (admin/comptable) pour gestion remises et mode
    - ✅ Backend `RemisesModule` : encapsulation du module avec dépendances
    - ✅ Frontend `remises.service.ts` : service API avec interfaces et méthodes CRUD
    - ✅ Frontend `Parametrage.tsx` : section Remises avec RadioGroup mode, inputs types client, inputs paliers volume
    - ✅ Backend intégration `VentesService` : injection `RemisesService`, calcul automatique remise lors création vente
    - ✅ Migration SQL champ `remise` dans `ventes` : ajout colonne remise avec défaut 0
    - ✅ Backend payload PDF : passage remise dans `buildFacturePayload` et `buildFactureGroupeePayload`
    - ✅ Frontend `Ventes.tsx` : colonne Remise dans tableau, affichage orange si > 0, calcul total ajusté
    - ✅ Template `invoice.html` : condition Jinja2 masquer échéance/conditions si statut == 'paye'
  - ✅ Facture groupée — Agrégation ventes par client/cycle, format `FAC-YYYYMM-XXXXXX-YZYZYZ`, preview `FactureGroupeePreview.tsx`
  - ✅ Template condition — Masquer échéance/conditions si facture payée

#### Phase 4 - ✅ Complète
*Phase 4 bien implémentée :*
  - ✅ Module backend `export/` — Controller et service centralisés pour exports CSV
  - ✅ Endpoint `/export/cycles` — CSV multi-cycles comparatif avec filtre period optionnel
  - ✅ Endpoint `/export/clients` — CSV liste clients (non supprimés uniquement)
  - ✅ Endpoint `/export/ventes` — CSV ventes avec filtres cycleId et statut optionnels
  - ✅ Endpoint `/export/donnees-brutes` — Dump CSV complet (admin only, sections : cycles, mortalités, ventes, dépenses, clients)
  - ✅ Format CSV — UTF-8 avec BOM, séparateur point-virgule, en-têtes français
  - ✅ Frontend `export.service.ts` — Service API avec méthodes exportCycles(), exportClients(), exportVentes(), exportDonneesBrutes()
  - ✅ Frontend `Dashboard.tsx` — Bouton "Exporter CSV" dans section comparatif cycles, utilise exportService.exportCycles(period)
  - ✅ Frontend `Clients.tsx` — Bouton "Exporter CSV" dans en-tête, utilise exportService.exportClients()
  - ✅ Frontend `Ventes.tsx` — Bouton "Exporter CSV" dans en-tête, utilise exportService.exportVentes(cycleId, statut)
  - ✅ Frontend `Parametrage.tsx` — Card "Administration" avec bouton "Exporter données brutes" (admin only)
  - ✅ Backend `app.module.ts` — Import et intégration de ExportModule

---

## 4. Critères d'acceptation globaux (à revalider à chaque version)

- [ ] Un cycle complet peut être créé, suivi de bout en bout, et clôturé avec un bilan financier exact
- [ ] Les calculs (coût de revient, marge, seuil de rentabilité, taux de mortalité) sont vérifiés et corrects
- [ ] Les alertes se déclenchent correctement selon les seuils définis
- [ ] Le tableau de bord reflète en temps réel l'état du cycle en cours
- [ ] Le système reste utilisable et cohérent après plusieurs cycles enregistrés

---

## 5. Suggestion d'organisation du dépôt

```
avipoul/
├── AVIPOUL.md                 ← ce fichier
├── backend/                   (NestJS + TypeScript + Sequelize)
│   ├── src/
│   │   ├── cycles/              (module/controller/service/entity — V0.1)
│   │   ├── stocks/               (mouvements_stock, produits_veterinaires — V0.1/V0.4)
│   │   ├── sante/                 (mortalites, vaccinations — V0.1/V0.4)
│   │   ├── finances/               (depenses, mouvements_tresorerie — V0.2)
│   │   ├── ventes/                  (ventes, clients, paiements — V0.2/V0.3)
│   │   ├── risques/                  (risques, alertes — V0.4)
│   │   ├── rapports/                  (rapports, factures — V1.0, appelle pdf-service)
│   │   ├── auth/                       (guards, stratégie JWT, rôles)
│   │   ├── common/                      (jobs cron : alertes auto, sauvegardes)
│   │   └── app.module.ts
│   ├── migrations/              (sequelize-cli, dérivées de schema-avipoul.sql)
│   └── .sequelizerc
├── frontend/                  (React + Vite + TypeScript + Chakra UI)
│   └── src/
│       ├── pages/               (Cycles, Stocks, Ventes, Dashboard...)
│       ├── components/
│       └── theme/                (personnalisation Chakra)
├── pdf-service/                (Python — rapports de cycle + factures uniquement)
│   ├── main.py                  (Flask/FastAPI minimal ou script CLI)
│   └── templates/
└── docs/
    ├── Cahier_des_charges_systeme_gestion_avipoul.pdf
    ├── schema-avipoul.sql
    └── guide-utilisateur.md
```

---

## 6. Prochaine étape immédiate

1. Choisir/valider la stack (section 1).
2. Initialiser le dépôt + le schéma de base de données (section 2).
3. Cocher les cases de la **V0.1** une par une, dans l'ordre.
4. Ne pas passer à la V0.2 avant d'avoir fait tourner un vrai cycle en V0.1.