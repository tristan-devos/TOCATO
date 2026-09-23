import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends TextInputProps {
  label: string;
}

/** Champ libellé (label + TextInput) : formulaires de connexion, devis… */
export function TextField({ label, style, ...rest }: TextFieldProps) {
  const colors = useTheme();
  return (
    <View style={styles.base}>
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.two },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    fontSize: FontSize.base,
  },
});
