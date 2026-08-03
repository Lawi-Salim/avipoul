-- 2026-08-01 : phases du cycle + notifications
-- Durées par défaut des 6 phases (jours), modifiables dans la page Paramétrage.
ALTER TABLE parametrages
  ADD COLUMN IF NOT EXISTS duree_phase_preparation integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS duree_phase_demarrage integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS duree_phase_croissance integer NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS duree_phase_finition integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS duree_phase_commercialisation integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS duree_phase_nettoyage integer NOT NULL DEFAULT 2;

-- Trace du dernier changement de phase d'un cycle (pour les rappels de phase bloquée).
ALTER TABLE cycles
  ADD COLUMN IF NOT EXISTS phase_changed_at timestamp with time zone;

UPDATE cycles SET phase_changed_at = created_at WHERE phase_changed_at IS NULL;
