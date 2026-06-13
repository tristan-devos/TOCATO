import type { PriceRange, ServiceId, TimeSlotId } from '@/lib/types';

export interface ServiceOption {
  id: string;
  label: string;
  hint?: string;
}

export interface ServiceQuestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multi';
  optional?: boolean;
  options: ServiceOption[];
}

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  categoryName: string;
  tagline: string;
  /** Indicative hourly range in CAD, shown on service cards */
  hourlyRange: PriceRange;
  questions: ServiceQuestion[];
}

export const SERVICES: Record<ServiceId, ServiceDefinition> = {
  plumber: {
    id: 'plumber',
    name: 'Plombier',
    categoryName: 'Plomberie',
    tagline: 'Fuites, débouchage, installations',
    hourlyRange: { min: 85, max: 150 },
    questions: [
      {
        id: 'issue',
        title: 'Quel est le problème ?',
        subtitle: "Choisissez le type d'intervention.",
        type: 'single',
        options: [
          { id: 'leak', label: "Fuite d'eau", hint: 'Robinet, tuyau, raccord…' },
          { id: 'unclogging', label: 'Débouchage', hint: 'Évier, douche, toilette…' },
          { id: 'waterHeater', label: 'Chauffe-eau', hint: 'Panne ou remplacement' },
          { id: 'installation', label: 'Installation', hint: 'Robinetterie, sanitaire…' },
          { id: 'other', label: 'Autre', hint: "Décrivez-le à l'étape suivante" },
        ],
      },
      {
        id: 'urgency',
        title: "C'est urgent ?",
        type: 'single',
        options: [
          { id: 'urgent', label: 'Oui, dans les 24 h', hint: 'Majoration possible' },
          { id: 'thisWeek', label: 'Cette semaine' },
          { id: 'flexible', label: 'Je suis flexible' },
        ],
      },
      {
        id: 'housingType',
        title: 'Type de logement ?',
        type: 'single',
        options: [
          { id: 'apartment', label: 'Appartement / condo' },
          { id: 'house', label: 'Maison' },
          { id: 'commercial', label: 'Local commercial' },
        ],
      },
    ],
  },

  mover: {
    id: 'mover',
    name: 'Déménageur',
    categoryName: 'Déménagement',
    tagline: 'Camion, bras et bonne humeur',
    hourlyRange: { min: 110, max: 180 },
    questions: [
      {
        id: 'housingSize',
        title: 'Quelle taille de logement ?',
        subtitle: 'Format québécois — comptez les pièces et demies.',
        type: 'single',
        options: [
          { id: 'studio', label: 'Studio / 1½ – 2½' },
          { id: 'threeToFour', label: '3½ – 4½' },
          { id: 'fivePlus', label: '5½ et plus' },
          { id: 'house', label: 'Maison' },
          { id: 'office', label: 'Bureau / commerce' },
        ],
      },
      {
        id: 'access',
        title: "L'accès au logement ?",
        subtitle: "Au départ ou à l'arrivée, le plus contraignant.",
        type: 'single',
        options: [
          { id: 'groundFloor', label: 'Rez-de-chaussée' },
          { id: 'withElevator', label: 'Étage avec ascenseur' },
          {
            id: 'withoutElevator',
            label: 'Étage sans ascenseur',
            hint: 'Les fameux escaliers montréalais',
          },
        ],
      },
      {
        id: 'extras',
        title: 'Des services en plus ?',
        type: 'multi',
        optional: true,
        options: [
          { id: 'packing', label: 'Emballage des cartons' },
          { id: 'furniture', label: 'Démontage / remontage des meubles' },
          { id: 'boxes', label: 'Fourniture de boîtes' },
          { id: 'storage', label: 'Entreposage temporaire' },
        ],
      },
      {
        id: 'distance',
        title: 'Sur quelle distance ?',
        type: 'single',
        options: [
          { id: 'neighborhood', label: 'Même quartier' },
          { id: 'city', label: 'Dans le Grand Montréal' },
          { id: 'longDistance', label: 'Longue distance', hint: 'Plus de 50 km' },
        ],
      },
    ],
  },

  gardener: {
    id: 'gardener',
    name: 'Jardinier',
    categoryName: 'Jardinage',
    tagline: 'Pelouse, haies et plates-bandes',
    hourlyRange: { min: 45, max: 90 },
    questions: [
      {
        id: 'work',
        title: 'Quels travaux ?',
        subtitle: 'Plusieurs choix possibles.',
        type: 'multi',
        options: [
          { id: 'mowing', label: 'Tonte de pelouse' },
          { id: 'hedges', label: 'Taille de haies et arbustes' },
          { id: 'weeding', label: 'Désherbage' },
          { id: 'planting', label: 'Plantation' },
          { id: 'landscaping', label: 'Aménagement paysager' },
        ],
      },
      {
        id: 'area',
        title: 'Quelle surface ?',
        type: 'single',
        options: [
          { id: 'small', label: 'Petit terrain', hint: 'Moins de 100 m²' },
          { id: 'medium', label: 'Terrain moyen', hint: '100 à 300 m²' },
          { id: 'large', label: 'Grand terrain', hint: 'Plus de 300 m²' },
        ],
      },
      {
        id: 'frequency',
        title: 'À quelle fréquence ?',
        type: 'single',
        options: [
          { id: 'once', label: 'Une seule fois' },
          { id: 'weekly', label: 'Chaque semaine' },
          { id: 'biweekly', label: 'Aux deux semaines' },
          { id: 'monthly', label: 'Chaque mois' },
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
 * Simple price estimate for demo purposes: hourly range × typical duration.
 * A real pricing engine will come from the backend.
 */
export function estimatePrice(serviceId: ServiceId): PriceRange {
  const typicalHours: Record<ServiceId, number> = {
    plumber: 2,
    mover: 4,
    gardener: 3,
  };
  const { min, max } = SERVICES[serviceId].hourlyRange;
  const hours = typicalHours[serviceId];
  return { min: min * hours, max: max * hours };
}
