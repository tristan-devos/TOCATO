/**
 * Catalogue de prestataires de démo — marché de Montréal.
 *
 * C'est le seul mock restant : les fiches prestataires affichées côté client
 * (conversations, offres, profil). Tout le reste (réservations, conversations,
 * messages) vit dans Supabase, et le seed de démo (avec dates relatives) est
 * dans `supabase/rpc.sql` (`seed_demo`).
 *
 * INVARIANT : ces IDs doivent refléter les prestataires seedés dans
 * `supabase/schema.sql`. Les conversations et réservations créées côté serveur
 * (Edge Function provider-reply, acceptation d'un devis) portent ces
 * `provider_id` — un ID absent d'un côté rend la fiche introuvable à l'affichage.
 */

import type { Provider, ServiceId } from '@/lib/types';

export const PROVIDERS: Provider[] = [
  {
    id: 'p-marc',
    name: 'Marc Tremblay',
    services: ['plumber'],
    rating: 4.9,
    reviewCount: 127,
    jobsCompleted: 340,
    verified: true,
    responseTime: 'Répond en ~15 min',
    hourlyRate: 95,
    bio: "Plombier certifié CMMTQ, 12 ans d'expérience sur le Plateau et Rosemont. Urgences acceptées.",
    memberSince: '2021',
  },
  {
    id: 'p-amadou',
    name: 'Amadou Diallo',
    services: ['plumber'],
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
    services: ['mover'],
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
    services: ['mover'],
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
    services: ['gardener'],
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
    services: ['gardener'],
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
