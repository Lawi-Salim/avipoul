-- Migration: Traçabilité created_by (qui a enregistré quoi)
-- Date: 2026-07-31
-- Ajoute created_by (FK users, ON DELETE SET NULL) sur ventes, depenses, risques et vaccinations.
-- Note: mortalites et mouvements_stock possèdent déjà created_by.

ALTER TABLE ventes
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE depenses
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE risques
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE vaccinations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;
