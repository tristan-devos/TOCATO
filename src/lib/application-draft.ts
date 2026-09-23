/**
 * Brouillon du formulaire d'adhésion et ses règles de validation.
 *
 * Mêmes règles que le serveur (submit_provider_application), vérifiées ici pour
 * guider la saisie ; le serveur reste l'arbitre. NEQ et licence RBQ se saisissent
 * avec ou sans tirets : seuls les chiffres comptent.
 */

import { parseAmountInput } from '@/lib/format';
import type { LocalPhoto } from '@/lib/photo-upload';
import type { ProviderApplication, ServiceId } from '@/lib/types';

/** Tarif horaire maximum accepté (strictement inférieur, comme en base). */
const MAX_HOURLY_RATE = 1000;

export interface ApplicationDraft {
  businessName: string;
  services: ServiceId[];
  /** Saisie brute (« 95 », « 95,50 »). */
  hourlyRate: string;
  bio: string;
  neq: string;
  rbqLicence: string;
  /** Nouvelle photo choisie, sinon on garde `idDocumentPath` (renvoi après refus). */
  idDocument: LocalPhoto | null;
  idDocumentPath: string | null;
  insurance: LocalPhoto | null;
  insurancePath: string | null;
}

/** Brouillon vide, ou prérempli depuis une demande refusée (pour la corriger). */
export function draftFrom(application: ProviderApplication | null): ApplicationDraft {
  return {
    businessName: application?.businessName ?? '',
    services: application?.services ?? [],
    hourlyRate: application ? String(application.hourlyRate) : '',
    bio: application?.bio ?? '',
    neq: application?.neq ?? '',
    rbqLicence: application?.rbqLicence ?? '',
    idDocument: null,
    idDocumentPath: application?.idDocumentPath ?? null,
    insurance: null,
    insurancePath: application?.insurancePath ?? null,
  };
}

export function digitsOnly(text: string): string {
  return text.replace(/\D/g, '');
}

/** La plomberie exige une licence RBQ (sous-catégorie 15.5). */
export function needsRbqLicence(services: ServiceId[]): boolean {
  return services.includes('plumber');
}

export function parseHourlyRate(text: string): number | null {
  const rate = parseAmountInput(text);
  return rate !== null && rate < MAX_HOURLY_RATE ? rate : null;
}

export function isBusinessStepValid(draft: ApplicationDraft): boolean {
  return (
    draft.businessName.trim().length > 0 &&
    draft.services.length > 0 &&
    parseHourlyRate(draft.hourlyRate) !== null
  );
}

export function isLegalStepValid(draft: ApplicationDraft): boolean {
  if (digitsOnly(draft.neq).length !== 10) return false;
  return !needsRbqLicence(draft.services) || digitsOnly(draft.rbqLicence).length === 10;
}

export function isDocumentsStepValid(draft: ApplicationDraft): boolean {
  return (
    (draft.idDocument !== null || draft.idDocumentPath !== null) &&
    (draft.insurance !== null || draft.insurancePath !== null)
  );
}

/** « 1100357101 » -> « 1100-3571-01 », format affiché par la RBQ. */
export function formatRbqLicence(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length !== 10) return digits;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}
