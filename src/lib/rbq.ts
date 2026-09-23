/**
 * Registre des licences RBQ : fraîcheur de notre copie (import nocturne) et lien de
 * vérification officiel. Source : Régie du bâtiment du Québec, Données Québec
 * (CC-BY 4.0), attribution affichée dans l'écran admin.
 */

/** Au-delà, l'écran admin alerte : l'import nocturne a probablement échoué. */
export const REGISTRY_STALE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vérification en ligne d'une licence, sur le site de la RBQ. */
export function rbqVerifyUrl(language: string): string {
  return language === 'en'
    ? 'https://www.rbq.gouv.qc.ca/en/you-are/citizen/check-a-contractors-licence/'
    : 'https://www.rbq.gouv.qc.ca/vous-etes/citoyen/verifier-la-licence-dun-entrepreneur/';
}

/** Âge du registre en jours entiers, ou null s'il n'a jamais été importé. */
export function registryAgeDays(lastImport: string | null, now: Date = new Date()): number | null {
  if (!lastImport) return null;
  return Math.floor((now.getTime() - new Date(lastImport).getTime()) / DAY_MS);
}

export function isRegistryStale(lastImport: string | null, now: Date = new Date()): boolean {
  const age = registryAgeDays(lastImport, now);
  return age === null || age > REGISTRY_STALE_DAYS;
}
