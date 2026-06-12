/**
 * Catalogue des services TOCATO et configuration du flux de réservation.
 *
 * Le wizard de réservation (src/app/booking/[service].tsx) est entièrement
 * piloté par cette config : ajouter un service = ajouter une entrée ici.
 */

import type { PriceRange, ServiceId, TimeSlotId } from '@/lib/types';

export interface ServiceOption {
  id: string;
  label: string;
  /** Précision affichée sous le libellé, ex. « 1 à 2 pièces » */
  hint?: string;
}

export interface ServiceQuestion {
  id: string;
  /** Question affichée en titre d'étape, ex. « Quel est le problème ? » */
  title: string;
  subtitle?: string;
  type: 'single' | 'multi';
  /** Pour `multi` : autoriser de continuer sans sélection */
  optional?: boolean;
  options: ServiceOption[];
}

export interface ServiceDefinition {
  id: ServiceId;
  /** Nom du métier, ex. « Plombier » */
  name: string;
  /** Nom de la prestation, ex. « Plomberie » */
  categoryName: string;
  tagline: string;
  /** Fourchette horaire indicative en CAD, affichée sur les cartes service */
  hourlyRange: PriceRange;
  questions: ServiceQuestion[];
}

export const SERVICES: Record<ServiceId, ServiceDefinition> = {
  plombier: {
    id: 'plombier',
    name: 'Plombier',
    categoryName: 'Plomberie',
    tagline: 'Fuites, débouchage, installations',
    hourlyRange: { min: 85, max: 150 },
    questions: [
      {
        id: 'intervention',
        title: 'Quel est le problème ?',
        subtitle: 'Choisissez le type d’intervention.',
        type: 'single',
        options: [
          { id: 'fuite', label: 'Fuite d’eau', hint: 'Robinet, tuyau, raccord…' },
          { id: 'debouchage', label: 'Débouchage', hint: 'Évier, douche, toilette…' },
          { id: 'chauffe-eau', label: 'Chauffe-eau', hint: 'Panne ou remplacement' },
          { id: 'installation', label: 'Installation', hint: 'Robinetterie, sanitaire…' },
          { id: 'autre', label: 'Autre', hint: 'Décrivez-le à l’étape suivante' },
        ],
      },
      {
        id: 'urgence',
        title: 'C’est urgent ?',
        type: 'single',
        options: [
          { id: 'urgent', label: 'Oui, dans les 24 h', hint: 'Majoration possible' },
          { id: 'semaine', label: 'Cette semaine' },
          { id: 'flexible', label: 'Je suis flexible' },
        ],
      },
      {
        id: 'logement',
        title: 'Type de logement ?',
        type: 'single',
        options: [
          { id: 'appartement', label: 'Appartement / condo' },
          { id: 'maison', label: 'Maison' },
          { id: 'commerce', label: 'Local commercial' },
        ],
      },
    ],
  },

  demenageur: {
    id: 'demenageur',
    name: 'Déménageur',
    categoryName: 'Déménagement',
    tagline: 'Camion, bras et bonne humeur',
    hourlyRange: { min: 110, max: 180 },
    questions: [
      {
        id: 'logement',
        title: 'Quelle taille de logement ?',
        subtitle: 'Format québécois — comptez les pièces et demies.',
        type: 'single',
        options: [
          { id: 'studio', label: 'Studio / 1½ – 2½' },
          { id: '3et4', label: '3½ – 4½' },
          { id: '5plus', label: '5½ et plus' },
          { id: 'maison', label: 'Maison' },
          { id: 'bureau', label: 'Bureau / commerce' },
        ],
      },
      {
        id: 'acces',
        title: 'L’accès au logement ?',
        subtitle: 'Au départ ou à l’arrivée, le plus contraignant.',
        type: 'single',
        options: [
          { id: 'rdc', label: 'Rez-de-chaussée' },
          { id: 'ascenseur', label: 'Étage avec ascenseur' },
          { id: 'escalier', label: 'Étage sans ascenseur', hint: 'Les fameux escaliers montréalais' },
        ],
      },
      {
        id: 'extras',
        title: 'Des services en plus ?',
        type: 'multi',
        optional: true,
        options: [
          { id: 'emballage', label: 'Emballage des cartons' },
          { id: 'meubles', label: 'Démontage / remontage des meubles' },
          { id: 'boites', label: 'Fourniture de boîtes' },
          { id: 'entreposage', label: 'Entreposage temporaire' },
        ],
      },
      {
        id: 'distance',
        title: 'Sur quelle distance ?',
        type: 'single',
        options: [
          { id: 'quartier', label: 'Même quartier' },
          { id: 'ville', label: 'Dans le Grand Montréal' },
          { id: 'longue', label: 'Longue distance', hint: 'Plus de 50 km' },
        ],
      },
    ],
  },

  jardinier: {
    id: 'jardinier',
    name: 'Jardinier',
    categoryName: 'Jardinage',
    tagline: 'Pelouse, haies et plates-bandes',
    hourlyRange: { min: 45, max: 90 },
    questions: [
      {
        id: 'travaux',
        title: 'Quels travaux ?',
        subtitle: 'Plusieurs choix possibles.',
        type: 'multi',
        options: [
          { id: 'tonte', label: 'Tonte de pelouse' },
          { id: 'haies', label: 'Taille de haies et arbustes' },
          { id: 'desherbage', label: 'Désherbage' },
          { id: 'plantation', label: 'Plantation' },
          { id: 'amenagement', label: 'Aménagement paysager' },
        ],
      },
      {
        id: 'surface',
        title: 'Quelle surface ?',
        type: 'single',
        options: [
          { id: 'petit', label: 'Petit terrain', hint: 'Moins de 100 m²' },
          { id: 'moyen', label: 'Terrain moyen', hint: '100 à 300 m²' },
          { id: 'grand', label: 'Grand terrain', hint: 'Plus de 300 m²' },
        ],
      },
      {
        id: 'frequence',
        title: 'À quelle fréquence ?',
        type: 'single',
        options: [
          { id: 'unique', label: 'Une seule fois' },
          { id: 'hebdo', label: 'Chaque semaine' },
          { id: 'bimensuel', label: 'Aux deux semaines' },
          { id: 'mensuel', label: 'Chaque mois' },
        ],
      },
    ],
  },
};

export const SERVICE_IDS = Object.keys(SERVICES) as ServiceId[];

export function getService(id: ServiceId): ServiceDefinition {
  return SERVICES[id];
}

export function isServiceId(value: string): value is ServiceId {
  return value in SERVICES;
}

export const TIME_SLOTS: { id: TimeSlotId; label: string; hours: string }[] = [
  { id: 'morning', label: 'Matin', hours: '8 h – 12 h' },
  { id: 'afternoon', label: 'Après-midi', hours: '12 h – 17 h' },
  { id: 'evening', label: 'Soir', hours: '17 h – 21 h' },
];

/**
 * Estimation de prix très simple pour la démo : fourchette horaire du service
 * multipliée par une durée typique. Un vrai moteur de prix viendra du backend.
 */
export function estimatePrice(serviceId: ServiceId): PriceRange {
  const typicalHours: Record<ServiceId, number> = {
    plombier: 2,
    demenageur: 4,
    jardinier: 3,
  };
  const { min, max } = SERVICES[serviceId].hourlyRange;
  const hours = typicalHours[serviceId];
  return { min: min * hours, max: max * hours };
}
