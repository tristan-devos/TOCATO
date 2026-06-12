import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';

interface AddressFormProps {
  onSaved: (addressId: string) => void;
  onCancel: () => void;
}

/** Formulaire d'ajout d'adresse (Montréal). Utilisé par le wizard et le profil. */
export function AddressForm({ onSaved, onCancel }: AddressFormProps) {
  const colors = useTheme();
  const addAddress = useAppStore((s) => s.addAddress);

  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const valid = street.trim().length > 3 && postalCode.trim().length >= 6;

  const save = () => {
    const id = addAddress({
      label: label.trim() || 'Autre',
      street: street.trim(),
      city: 'Montréal',
      postalCode: postalCode.trim().toUpperCase(),
    });
    onSaved(id);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
  ];

  return (
    <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppText variant="label">Nouvelle adresse</AppText>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Nom (ex. : Chalet)"
        placeholderTextColor={colors.textSecondary}
        style={inputStyle}
      />
      <TextInput
        value={street}
        onChangeText={setStreet}
        placeholder="Numéro et rue"
        placeholderTextColor={colors.textSecondary}
        style={inputStyle}
      />
      <TextInput
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder="Code postal (ex. : H2J 2L2)"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="characters"
        style={inputStyle}
      />
      <View style={styles.actions}>
        <Button title="Annuler" variant="ghost" size="sm" onPress={onCancel} />
        <Button title="Enregistrer" size="sm" onPress={save} disabled={!valid} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two + 4,
  },
  input: {
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: FontSize.base,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
});
