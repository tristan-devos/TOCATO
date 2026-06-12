/**
 * Données mock pour la démo TOCATO — marché de Montréal.
 *
 * Les dates sont générées relativement à aujourd'hui pour que la démo reste
 * crédible quel que soit le jour où on la lance. Tout ceci sera remplacé par
 * le backend.
 */

import type {
  Address,
  Booking,
  Conversation,
  Message,
  Provider,
  ServiceId,
  User,
} from '@/lib/types';

/** ISO date-time décalée de `days` jours (et `hours` heures) par rapport à maintenant. */
export function isoFromNow(days: number, hours = 0): string {
  return new Date(Date.now() + (days * 24 + hours) * 3_600_000).toISOString();
}

/** ISO date seule (YYYY-MM-DD) décalée de `days` jours. */
export function isoDateFromNow(days: number): string {
  return isoFromNow(days).slice(0, 10);
}

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export const PROVIDERS: Provider[] = [
  {
    id: 'p-marc',
    name: 'Marc Tremblay',
    services: ['plombier'],
    rating: 4.9,
    reviewCount: 127,
    jobsCompleted: 340,
    verified: true,
    responseTime: 'Répond en ~15 min',
    hourlyRate: 95,
    bio: 'Plombier certifié CMMTQ, 12 ans d’expérience sur le Plateau et Rosemont. Urgences acceptées.',
    memberSince: '2021',
  },
  {
    id: 'p-amadou',
    name: 'Amadou Diallo',
    services: ['plombier'],
    rating: 4.8,
    reviewCount: 89,
    jobsCompleted: 210,
    verified: true,
    responseTime: 'Répond en ~30 min',
    hourlyRate: 90,
    bio: 'Spécialiste débouchage et chauffe-eau. Travail propre, devis clair avant chaque intervention.',
    memberSince: '2022',
  },
  {
    id: 'p-jp',
    name: 'Jean-Philippe Côté',
    services: ['demenageur'],
    rating: 4.7,
    reviewCount: 203,
    jobsCompleted: 480,
    verified: true,
    responseTime: 'Répond en ~1 h',
    hourlyRate: 120,
    bio: 'Équipe de 2 à 4 déménageurs, camion 20 pieds. Habitués des escaliers en colimaçon montréalais.',
    memberSince: '2020',
  },
  {
    id: 'p-kevin',
    name: 'Kevin Nguyen',
    services: ['demenageur'],
    rating: 4.9,
    reviewCount: 156,
    jobsCompleted: 320,
    verified: true,
    responseTime: 'Répond en ~20 min',
    hourlyRate: 115,
    bio: 'Déménagement résidentiel et petit commercial. Couvertures, sangles et diable fournis.',
    memberSince: '2021',
  },
  {
    id: 'p-sophie',
    name: 'Sophie Gagnon',
    services: ['jardinier'],
    rating: 5.0,
    reviewCount: 78,
    jobsCompleted: 190,
    verified: true,
    responseTime: 'Répond en ~45 min',
    hourlyRate: 55,
    bio: 'Horticultrice passionnée. Entretien écologique, sans pesticides. Rosemont, Villeray et alentours.',
    memberSince: '2022',
  },
  {
    id: 'p-maria',
    name: 'Maria Fernandez',
    services: ['jardinier'],
    rating: 4.8,
    reviewCount: 112,
    jobsCompleted: 260,
    verified: false,
    responseTime: 'Répond en ~2 h',
    hourlyRate: 60,
    bio: 'Aménagement paysager et entretien saisonnier. Devis gratuit sur photos.',
    memberSince: '2023',
  },
];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function providersForService(serviceId: ServiceId): Provider[] {
  return PROVIDERS.filter((p) => p.services.includes(serviceId)).sort(
    (a, b) => b.rating - a.rating,
  );
}

const HOME_ADDRESS: Address = {
  id: 'addr-home',
  label: 'Maison',
  street: '4521, rue Saint-Denis, app. 3',
  city: 'Montréal',
  postalCode: 'H2J 2L2',
};

const WORK_ADDRESS: Address = {
  id: 'addr-work',
  label: 'Bureau',
  street: '1250, boul. René-Lévesque Ouest',
  city: 'Montréal',
  postalCode: 'H3B 4W8',
};

export const SEED_USER: User = {
  name: 'Tristan Devos',
  email: 'tristan2003devos@gmail.com',
  phone: '514 555-0182',
  addresses: [HOME_ADDRESS, WORK_ADDRESS],
};

/**
 * Scénario de départ :
 *  - une réservation plomberie à venir, avec un devis en attente dans le chat ;
 *  - une réservation jardinage terminée, avec facture dans le chat.
 */

const PLUMBING_BOOKING: Booking = {
  id: 'b-seed-plomberie',
  serviceId: 'plombier',
  status: 'pending',
  createdAt: isoFromNow(-2, -3),
  scheduledDate: isoDateFromNow(3),
  timeSlot: 'morning',
  address: HOME_ADDRESS,
  answers: [
    { questionId: 'intervention', questionLabel: 'Quel est le problème ?', values: ['Fuite d’eau'] },
    { questionId: 'urgence', questionLabel: 'C’est urgent ?', values: ['Cette semaine'] },
    { questionId: 'logement', questionLabel: 'Type de logement ?', values: ['Appartement / condo'] },
  ],
  description:
    'Fuite sous l’évier de la cuisine, le raccord du siphon goutte en continu. J’ai mis un seau en attendant.',
  photoCount: 2,
  estimate: { min: 170, max: 300 },
  providerId: 'p-marc',
  conversationId: 'c-seed-plomberie',
};

const GARDEN_BOOKING: Booking = {
  id: 'b-seed-jardin',
  serviceId: 'jardinier',
  status: 'completed',
  createdAt: isoFromNow(-16),
  scheduledDate: isoDateFromNow(-12),
  timeSlot: 'afternoon',
  address: HOME_ADDRESS,
  answers: [
    {
      questionId: 'travaux',
      questionLabel: 'Quels travaux ?',
      values: ['Tonte de pelouse', 'Taille de haies et arbustes'],
    },
    { questionId: 'surface', questionLabel: 'Quelle surface ?', values: ['Petit terrain'] },
    { questionId: 'frequence', questionLabel: 'À quelle fréquence ?', values: ['Une seule fois'] },
  ],
  description: 'Petite cour arrière, haie de cèdres à rafraîchir avant l’été.',
  photoCount: 0,
  estimate: { min: 135, max: 270 },
  agreedPrice: 160,
  providerId: 'p-sophie',
  conversationId: 'c-seed-jardin',
};

export const SEED_BOOKINGS: Booking[] = [PLUMBING_BOOKING, GARDEN_BOOKING];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'c-seed-plomberie',
    providerId: 'p-marc',
    bookingId: 'b-seed-plomberie',
    unreadCount: 1,
    lastMessageAt: isoFromNow(0, -2),
  },
  {
    id: 'c-seed-jardin',
    providerId: 'p-sophie',
    bookingId: 'b-seed-jardin',
    unreadCount: 0,
    lastMessageAt: isoFromNow(-11),
  },
];

export const SEED_MESSAGES: Message[] = [
  // — Plomberie (devis en attente) —
  {
    id: 'm-p1',
    conversationId: 'c-seed-plomberie',
    senderId: 'system',
    type: 'system',
    text: 'Votre demande a été envoyée à Marc Tremblay.',
    createdAt: isoFromNow(-2, -3),
  },
  {
    id: 'm-p2',
    conversationId: 'c-seed-plomberie',
    senderId: 'p-marc',
    type: 'text',
    text: 'Bonjour Tristan ! J’ai bien vu votre demande pour la fuite sous l’évier. Les photos sont claires, c’est fort probablement le joint du siphon.',
    createdAt: isoFromNow(-2, -1),
  },
  {
    id: 'm-p3',
    conversationId: 'c-seed-plomberie',
    senderId: 'me',
    type: 'text',
    text: 'Bonjour ! Oui c’est ça, ça goutte surtout quand on fait couler l’eau. Vous pouvez passer cette semaine ?',
    createdAt: isoFromNow(-1, -6),
  },
  {
    id: 'm-p4',
    conversationId: 'c-seed-plomberie',
    senderId: 'p-marc',
    type: 'quote',
    text: 'Voici mon devis pour l’intervention. Je peux passer comme prévu en matinée.',
    createdAt: isoFromNow(0, -2),
    quote: {
      amount: 185,
      details: 'Remplacement du siphon et des joints, main-d’œuvre et déplacement inclus. Garantie 6 mois.',
      status: 'pending',
    },
  },

  // — Jardinage (terminé) —
  {
    id: 'm-j1',
    conversationId: 'c-seed-jardin',
    senderId: 'system',
    type: 'system',
    text: 'Votre demande a été envoyée à Sophie Gagnon.',
    createdAt: isoFromNow(-16),
  },
  {
    id: 'm-j2',
    conversationId: 'c-seed-jardin',
    senderId: 'p-sophie',
    type: 'text',
    text: 'Bonjour ! Merci pour votre demande. Pour une petite cour avec haie de cèdres, je propose 160 $ tout inclus.',
    createdAt: isoFromNow(-15),
  },
  {
    id: 'm-j3',
    conversationId: 'c-seed-jardin',
    senderId: 'me',
    type: 'text',
    text: 'Parfait pour moi, on confirme !',
    createdAt: isoFromNow(-15, 2),
  },
  {
    id: 'm-j4',
    conversationId: 'c-seed-jardin',
    senderId: 'p-sophie',
    type: 'text',
    text: 'C’est fait ! La haie est taillée et la pelouse tondue. Merci pour votre confiance.',
    createdAt: isoFromNow(-12, 5),
  },
  {
    id: 'm-j5',
    conversationId: 'c-seed-jardin',
    senderId: 'p-sophie',
    type: 'document',
    text: 'Voici votre facture.',
    createdAt: isoFromNow(-11),
    document: { name: 'Facture-TOCATO-0214.pdf', size: '86 Ko' },
  },
];

/** Réponses automatiques du prestataire pour simuler une conversation en démo. */
export const CANNED_REPLIES: string[] = [
  'Parfait, c’est noté !',
  'Très bonne question — oui, tout le matériel de base est inclus.',
  'Je vous confirme ça d’ici la fin de la journée.',
  'Pas de souci, je m’adapte à votre horaire.',
  'Merci pour la précision, ça m’aide à bien préparer l’intervention.',
];
