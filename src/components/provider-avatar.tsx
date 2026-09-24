import { Avatar } from '@/components/ui/avatar';
import { useProviderPhotoUrl } from '@/lib/provider-photo';

interface ProviderAvatarProps {
  name: string;
  /** Chemin Storage de la photo publiée (Provider.photoPath) ; null = initiales. */
  photoPath: string | null | undefined;
  size?: number;
}

/** Avatar d'un prestataire : sa photo validée, sinon ses initiales. */
export function ProviderAvatar({ name, photoPath, size }: ProviderAvatarProps) {
  const uri = useProviderPhotoUrl(photoPath);
  return <Avatar name={name} size={size} uri={uri} cacheKey={photoPath ?? undefined} />;
}
