# BACKUP-AVIPOUL - Guide de Sauvegarde et Restauration

## Vue d'ensemble

Système de backup/restauration PostgreSQL pour le projet Avipoul en environnement Windows local.

- **Base de données:** `avipoul` (PostgreSQL)
- **Backend:** NestJS + TypeScript
- **Gestionnaire de paquets:** yarn

## Prérequis

- PostgreSQL installé avec `pg_dump` et `psql` dans le PATH système
- Node.js et yarn
- Variables d'environnement configurées dans `backend/.env`

### Vérifier que pg_dump est accessible

```powershell
pg_dump --version
psql --version
```

Si les commandes ne sont pas reconnues, ajoutez le dossier `bin` de PostgreSQL au PATH :
```
C:\Program Files\PostgreSQL\17\bin
```

## Configuration

Variables d'environnement dans `backend/.env` :

```env
# Backup
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

| Variable | Description | Défaut |
|----------|-------------|--------|
| `BACKUP_DIR` | Répertoire de stockage des backups | `./backups` |
| `BACKUP_RETENTION_DAYS` | Durée de rétention des backups (jours) | `30` |

## Scripts disponibles

Tous les scripts s'exécutent depuis le dossier `backend/`.

| Script | Commande | Description |
|--------|----------|-------------|
| Backup | `yarn backup` | Créer un backup compressé de la base |
| Restore | `yarn restore` | Restaurer depuis un backup |
| Validate | `yarn validate-backup` | Valider l'intégrité d'un fichier backup |

## Utilisation

### Créer un backup

```powershell
cd backend
yarn backup
```

Le script :
1. Exécute `pg_dump` sur la base `avipoul`
2. Compresse le dump en gzip
3. Nomme le fichier : `avipoul-backup-YYYY-MM-DD-HHMMSS.sql.gz`
4. Nettoie les backups de plus de 30 jours
5. Affiche un résumé en console

**Sortie :**
```
[2026-07-25 19:45:00] [INFO] Starting backup for database "avipoul" on localhost:5432
[2026-07-25 19:45:01] [INFO] Running pg_dump...
[2026-07-25 19:45:03] [INFO] Compressing dump file...
[2026-07-25 19:45:04] [INFO] Cleaning backups older than 30 days...
[2026-07-25 19:45:04] [INFO] Removed 0 old backup(s)
[2026-07-25 19:45:04] [INFO] ──────────────────────────────────────────────────
[2026-07-25 19:45:04] [INFO]   Backup completed successfully!
[2026-07-25 19:45:04] [INFO]   File: C:\...\backups\avipoul-backup-2026-07-25-19-45-04.sql.gz
[2026-07-25 19:45:04] [INFO]   Size: 0.45 MB
[2026-07-25 19:45:04] [INFO]   Duration: 3.2s
[2026-07-25 19:45:04] [INFO] ──────────────────────────────────────────────────
```

### Restaurer un backup

#### Mode dry-run (vérification sans modification)

```powershell
cd backend
yarn restore -- --file backups/avipoul-backup-2026-07-25-19-45-04.sql.gz --dry-run
```

#### Restauration complète

```powershell
cd backend
yarn restore -- --file backups/avipoul-backup-2026-07-25-19-45-04.sql.gz
```

#### Restauration sans backup préalable (dangereux)

```powershell
cd backend
yarn restore -- --file backups/avipoul-backup-2026-07-25-19-45-04.sql.gz --no-backup
```

**Options CLI :**

| Option | Description |
|--------|-------------|
| `--file <path>` | Chemin vers le fichier backup (obligatoire) |
| `--dry-run` | Mode simulation — vérifie sans restaurer |
| `--no-backup` | Saute le backup pré-restauration |

### Valider un backup

```powershell
cd backend
yarn validate-backup -- backups/avipoul-backup-2026-07-25-19-45-04.sql.gz
```

Affiche les informations du fichier : taille, date, tables, format, compression.

## Structure des fichiers

```
backend/
├── backups/
│   ├── avipoul-backup-2026-07-25-19-45-04.sql.gz
│   ├── avipoul-backup-2026-07-24-10-00-00.sql.gz
│   └── logs/
│       ├── backup.log
│       ├── restore.log
│       └── validate.log
├── scripts/
│   ├── backup.ts
│   ├── restore.ts
│   └── validate-backup.ts
├── .env
└── package.json
```

## Tâche planifiée Windows (Backup automatique)

Pour configurer un backup automatique quotidien via le Planificateur de tâches Windows :

### Option 1 : Via PowerShell (admin)

```powershell
# Créer un fichier batch
$batchContent = @'
cd /d C:\Users\Lawi-Salim\Documents\Mwamtsa\Avipoul\backend
yarn backup
'@
$batchPath = "C:\Users\Lawi-Salim\Documents\Mwamtsa\Avipoul\backend\scripts\auto-backup.bat"
Set-Content -Path $batchPath -Value $batchContent

# Créer la tâche planifiée
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batchPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At "23:00"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName "Avipoul Backup" -Action $action -Trigger $trigger -Settings $settings -Description "Backup automatique quotidien de la base avipoul"
```

### Option 2 : Via l'interface graphique

1. Ouvrir le Planificateur de tâches (`taskschd.msc`)
2. Créer une tâche basique
3. Nom : "Avipoul Backup"
4. Déclencheur : Quotidien à 23:00
5. Action : démarrer un programme → `cmd.exe` avec argument `/c "cd /d C:\Users\Lawi-Salim\Documents\Mwamtsa\Avipoul\backend && yarn backup"`

## Procédure de restauration

### En cas de problème avec la base de données

1. **Identifier le backup à restaurer**
   ```powershell
   ls backend\backups\*.sql.gz
   ```

2. **Vérifier le backup en mode dry-run**
   ```powershell
   cd backend
   yarn restore -- --file backups/avipoul-backup-XXXX-XX-XX-XX-XX-XX.sql.gz --dry-run
   ```

3. **Valider le contenu du backup**
   ```powershell
   yarn validate-backup -- backups/avipoul-backup-XXXX-XX-XX-XX-XX-XX.sql.gz
   ```

4. **Restaurer (un backup pré-restore sera créé automatiquement)**
   ```powershell
   yarn restore -- --file backups/avipoul-backup-XXXX-XX-XX-XX-XX-XX.sql.gz
   ```

5. **Vérifier que l'application fonctionne**
   ```powershell
   yarn dev
   ```

6. **En cas d'échec de la restauration**, restaurer depuis le backup pré-restore :
   ```powershell
   yarn restore -- --file backups/avipoul-pre-restore-XXXX-XX-XX-XX-XX-XX.sql.gz --no-backup
   ```

## Dépannage

### "pg_dump" n'est pas reconnu

Le binaire PostgreSQL n'est pas dans le PATH.

**Solution :** Ajoutez `C:\Program Files\PostgreSQL\17\bin` au PATH système, ou utilisez le chemin complet dans les scripts.

### Erreur "password authentication failed"

Le mot de passe dans `DATABASE_URL` ne correspond pas.

**Solution :** Vérifiez les credentials dans `backend/.env` :
```
DATABASE_URL=postgresql://postgres:*******@localhost:5432/avipoul?sslmode=disable
```

### Erreur "connection refused"

PostgreSQL n'est pas en cours d'exécution.

**Solution :** Démarrez le service PostgreSQL :
```powershell
net start postgresql-x64-17
```

### Espace disque insuffisant

Vérifiez l'espace disponible et réduisez la rétention :
```env
BACKUP_RETENTION_DAYS=7
```

### Le script ne trouve pas tsx

**Solution :** Installez les dépendances :
```powershell
cd backend
yarn install
```
