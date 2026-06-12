import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddressForm } from '@/components/address-form';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';

interface AddressStepProps {
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
}

/** Étape « adresse » : choix parmi les adresses enregistrées, ou ajout d'une nouvelle. */
export function AddressStep({ selectedAddressId, onSelect }: AddressStepProps) {
  const colors = useTheme();
  const addresses = useAppStore((s) => s.user.addresses);
  const [showForm, setShowForm] = useState(false);

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">Où a lieu la prestation ?</AppText>
        <AppText variant="secondary">TOCATO est disponible dans le Grand Montréal.</AppText>
      </View>

      <View style={styles.options}>
        {addresses.map((address) => (
          <Chip
            key={address.id}
            label={address.label}
            hint={`${address.street}, ${address.city} ${address.postalCode}`}
            selected={selectedAddressId === address.id}
            onPress={() => onSelect(address.id)}
          />
        ))}
      </View>

      {showForm ? (
        <AddressForm
          onSaved={(addressId) => {
            onSelect(addressId);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Pressable
          onPress={() => setShowForm(true)}
          style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.6 : 1 }]}>
          <Plus size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Ajouter une adresse
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  titles: { gap: Spacing.two },
  options: { gap: Spacing.two + 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
