# PDF Service — Rapports de Cycles & Factures

Service Python (FastAPI + WeasyPrint) pour générer les rapports PDF des cycles clôturés et les factures de vente.

## Prérequis

- Python 3.10+
- pip

## Installation

```bash
cd pdf-service
pip install -r requirements.txt
```

## Lancement

### Développement (hot reload)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Le service est disponible sur `http://localhost:8000`.

## Docker

### Construire l'image Docker

```bash
# Construire l'image localement
docker build -t avipoul-pdf-service .

# Ou avec docker-compose (recommandé)
docker compose build
```

### Lancer le conteneur

```bash
# Lancer avec docker-compose (recommandé pour le développement)
docker compose up

# Lancer en arrière-plan (detached mode)
docker compose up -d

# Lancer avec reconstruction forcée
docker compose up --build
```

### Gérer le conteneur

```bash
# Voir les logs
docker compose logs -f pdf-service

# Arrêter le conteneur
docker compose down

# Arrêter et supprimer les volumes
docker compose down -v

# Redémarrer le conteneur
docker compose restart
```

### Lancer manuellement avec docker run

```bash
docker run -d \
  --name avipoul-pdf-service \
  -p 8000:8000 \
  -v $(pwd):/app \
  avipoul-pdf-service
```

## Endpoints

| Méthode | URL                    | Description                              |
|---------|------------------------|------------------------------------------|
| GET     | `/health`              | Vérifie que le service est actif         |
| POST    | `/rapport-cycle`       | Génère le PDF d'un cycle (JSON body)     |
| POST    | `/rapport-cycle-html`  | Génère le HTML d'un cycle (pour preview) |
| POST    | `/facture`             | Génère le PDF d'une facture (JSON body)  |
| POST    | `/facture-html`        | Génère le HTML d'une facture (preview)   |

## Test rapide

```bash
# Vérifier que le service tourne
curl http://localhost:8000/health

# Tester la génération d'un cycle (exemple avec un body JSON)
curl -X POST http://localhost:8000/rapport-cycle \
  -H "Content-Type: application/json" \
  -d '{"cycle":{"numero_cycle":"C001","date_reception":"2025-06-01","date_cloture":"2025-07-01","effectif_initial":1000,"phase_courante":"commercialisation","cout_achat_poussins":500,"bilan_mortalite_cumulee":50},"mortalites":[],"depenses":[],"ventes":[],"bilan":{"cout_total":100000,"recettes":200000,"marge":100000,"cout_revient_par_poulet":100,"effectif_vivant":950,"seuil_rentabilite":500}}' \
  --output test.pdf

# Tester la génération d'une facture
curl -X POST http://localhost:8000/facture \
  -H "Content-Type: application/json" \
  -d '{"facture":{"numero":"FAC-202607-000034","date_emission":"16/07/2026","date_echeance":"23/07/2026","cycle_reference":"Cycle #10","statut_paiement":"Facture payée","conditions":"7 jours net","notes":"Total 55 poulets.","sous_total":148000,"remise":0,"total":148000},"client":{"nom":"Restaurant Le Lagon","type":"Restaurant","contact":"+269 XXX XX XX"},"articles":[{"designation":"Poulet de chair, vif","quantite":40,"prix_unitaire":2500,"total":100000},{"designation":"Poulet de chair, prêt à cuire","quantite":15,"prix_unitaire":3200,"total":48000}]}' \
  --output test-facture.pdf
```

## Variables d'environnement

| Variable          | Défaut                  | Description                     |
|-------------------|-------------------------|---------------------------------|
| PDF_SERVICE_URL   | `http://localhost:8000` | URL du service (côté backend)   |

## Intégration avec le Backend NestJS

Le backend NestJS appelle ce service via :
- `GET /rapports/cycle/:id/pdf` — pour les rapports de cycles
- `GET /rapports/facture/:id/pdf` — pour les factures de vente

Le flow est :
1. L'utilisateur clique sur l'icône ⬇️ dans le détail d'un cycle ou sur l'icône 📄 dans la page des ventes
2. Le frontend appelle `GET /rapports/cycle/:id/pdf` ou `GET /rapports/facture/:id/pdf`
3. Le backend récupère les données, les envoie en JSON au service Python
4. Le service Python génère le PDF via WeasyPrint et le renvoie
5. Le frontend télécharge le fichier
