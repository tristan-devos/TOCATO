import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProfileStore } from '@/lib/profile-store';

interface AddressFormProps {
  onSaved: (addressId: string) => void;
  onCancel: () => void;
}

export function AddressForm({ onSaved, onCancel }: AddressFormProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const addAddress = useProfileStore((s) => s.addAddress);

  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = street.trim().length > 3 && postalCode.trim().length >= 6;

  const save = async () => {
    setSaving(true);
    const id = await addAddress({
      label: label.trim() || t('addressForm.defaultLabel'),
      street: street.trim(),
      city: 'Montréal',
      postalCode: postalCode.trim().toUpperCase(),
    });
    setSaving(false);
    if (id) onSaved(id);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
  ];

  return (
    <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppText variant="label">{t('addressForm.title')}</AppText>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder={t('addressForm.labelPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={inputStyle}
      />
      <TextInput
        value={street}
        onChangeText={setStreet}
        placeholder={t('addressForm.streetPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={inputStyle}
      />
      <TextInput
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder={t('addressForm.postalCodePlaceholder')}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="characters"
        style={inputStyle}
      />
      <View style={styles.actions}>
        <Button title={t('common.cancel')} variant="ghost" size="sm" onPress={onCancel} />
        <Button
          title={t('common.save')}
          size="sm"
          onPress={() => void save()}
          disabled={!valid}
          loading={saving}
        />
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
