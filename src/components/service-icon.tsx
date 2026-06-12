import { Leaf, Truck, Wrench, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ServiceId } from '@/lib/types';

const ICONS: Record<ServiceId, LucideIcon> = {
  plombier: Wrench,
  demenageur: Truck,
  jardinier: Leaf,
};

interface ServiceIconProps {
  serviceId: ServiceId;
  /** Taille de l'icône elle-même */
  size?: number;
  /** Affiche l'icône dans un carré arrondi au fond de marque atténué */
  boxed?: boolean;
  /** Taille du carré quand `boxed` est actif */
  boxSize?: number;
}

export function ServiceIcon({ serviceId, size = 22, boxed = false, boxSize = 56 }: ServiceIconProps) {
  const colors = useTheme();
  const Icon = ICONS[serviceId];

  if (!boxed) {
    return <Icon size={size} color={colors.primary} />;
  }
  return (
    <View
      style={[
        styles.box,
        { width: boxSize, height: boxSize, backgroundColor: colors.primaryMuted },
      ]}>
      <Icon size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
