-- Migration: File de travail du comptable (validation)
-- Date: 2026-07-31
-- Ajoute valide_le / valide_par (FK users, ON DELETE SET NULL) sur ventes, mouvements_stock et mortalites.
-- valide_le NULL = opération en attente de validation ; valide_par = qui a validé.

ALTER TABLE ventes
  ADD COLUMN IF NOT EXISTS valide_le timestamptz,
  ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE mouvements_stock
  ADD COLUMN IF NOT EXISTS valide_le timestamptz,
  ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE mortalites
  ADD COLUMN IF NOT EXISTS valide_le timestamptz,
  ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES users(id) ON DELETE SET NULL;
