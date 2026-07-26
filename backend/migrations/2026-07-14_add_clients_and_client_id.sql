-- Migration: Ajout de la table clients et de la colonne client_id dans ventes
-- Date: 2026-07-14
-- Note: Ce schéma est déjà appliqué via schema-avipoul.sql.
-- Ce fichier sert de référence et de backup.

-- 1. Créer la table clients (selon schema-avipoul.sql)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_client text NOT NULL DEFAULT 'menage',
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

-- 2. La colonne client_id existe déjà dans ventes (schema-avipoul.sql)
-- ALTER TABLE ventes ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
