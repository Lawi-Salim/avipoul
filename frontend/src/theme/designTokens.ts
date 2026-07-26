/**
 * Design Tokens Centralises - Avipoul
 *
 * Ce fichier contient tous les tokens de design responsive utilises dans l'application.
 * Utilise ces tokens pour garantir la coherence visuelle sur tous les ecrans.
 *
 * POURQUOI DES NOMS DISTINCTS DE CHAKRA UI ?
 * Chakra UI definit deja des tokens comme "sm", "md", "lg" pour ses propres proprietes.
 * En utilisant des noms distincts (responsiveText, responsiveSpacing), on evite toute
 * collision ou confusion avec les tokens Chakra existants.
 *
 * USAGE:
 *   import { responsiveText } from '../theme/designTokens';
 *   <Text fontSize={responsiveText.md}>Texte responsive</Text>
 *
 * AVEC HELPERS:
 *   import { getTextSize, getSpacing } from '../theme/designTokens';
 *   <Text fontSize={getTextSize('md')} p={getSpacing('md')}>Texte</Text>
 *
 * AJOUTER DE NOUVEAUX TOKENS:
 *   1. Ajouter la cle dans l'objet correspondant (responsiveText, responsiveSpacing, etc.)
 *   2. Definir les valeurs pour chaque breakpoint si responsive, ou une valeur fixe
 *   3. L'inférence TypeScript se fait automatiquement grace a `as const`
 */

// Breakpoints standards (reference pour les tokens responsive)
export const breakpoints = {
  base: '0px',      // Mobile first
  sm: '480px',      // Petit mobile
  md: '768px',      // Tablette
  lg: '992px',      // Desktop
  xl: '1280px',     // Grand desktop
  '2xl': '1536px',  // Ultra large
} as const;

// Tailles de texte responsive - NOMS DISTINCTS de Chakra UI
export const responsiveText = {
  // Extra small - labels, badges
  xs: { base: '10px', sm: '11px', md: '12px' },

  // Small - captions, secondary text
  sm: { base: '12px', sm: '13px', md: '14px' },

  // Medium - body text, inputs
  md: { base: '14px', sm: '15px', md: '16px' },

  // Large - headings, buttons
  lg: { base: '16px', sm: '18px', md: '20px' },

  // Extra large - section headings
  xl: { base: '18px', sm: '20px', md: '24px' },

  // 2XL - page headings
  '2xl': { base: '20px', sm: '24px', md: '28px' },

  // 3XL - hero titles
  '3xl': { base: '24px', sm: '28px', md: '32px' },
} as const;

// Espacements coherents - NOMS DISTINCTS
export const responsiveSpacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '16px',   // 1rem
  ms: '18px',   // 1.125rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
} as const;

// Hauteurs de ligne pour la lisibilite
export const textLineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
} as const;

// Epaisseurs de police
export const textWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Helper function pour obtenir la taille responsive
export function getTextSize(size: keyof typeof responsiveText) {
  return responsiveText[size];
}

// Helper pour obtenir l'espacement
export function getSpacing(size: keyof typeof responsiveSpacing) {
  return responsiveSpacing[size];
}
