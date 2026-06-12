import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressForm } from '@/components/address-form';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ListItem } from '@/components/ui/list-item';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';

export default function AddressesScreen() {
  const colors = useTheme();
  const addresses = useAppStore((s) => s.user.addresses);
  const removeAddress = useAppStore((s) => s.removeAddress);
  const [showForm, setShowForm] = useState(false);

  const confirmRemove = (addressId: string, label: string) => {
    Alert.alert('Supprimer cette adresse ?', `« ${label} » sera retirée de votre compte.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeAddress(addressId) },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title="Mes adresses" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          {addresses.map((address) => (
            <ListItem
              key={address.id}
              title={address.label}
              subtitle={`${address.street}, ${address.city} ${address.postalCode}`}
              leading={<MapPin size={20} color={colors.primary} />}
              trailing={
                addresses.length > 1 ? (
                  <Pressable onPress={() => confirmRemove(address.id, address.label)} hitSlop={8}>
                    <Trash2 size={18} color={colors.destructive} />
                  </Pressable>
                ) : null
              }
            />
          ))}
        </Card>

        {showForm ? (
          <AddressForm onSaved={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },
  card: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
