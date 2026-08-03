export function creatorLabel(creator?: { nom?: string; prenom?: string } | null): string {
  if (!creator?.nom) return '';
  const prenom = creator.prenom ? ` ${creator.prenom}` : '';
  return `${creator.nom}${prenom}`;
  // return `Enregistré par ${creator.nom}${prenom}`;
}
