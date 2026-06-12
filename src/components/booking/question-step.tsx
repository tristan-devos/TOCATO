import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import type { ServiceQuestion } from '@/lib/services';

interface QuestionStepProps {
  question: ServiceQuestion;
  selected: string[];
  onChange: (optionIds: string[]) => void;
}

/** Étape « question » du wizard : choix simple ou multiple parmi des options. */
export function QuestionStep({ question, selected, onChange }: QuestionStepProps) {
  const toggle = (optionId: string) => {
    if (question.type === 'single') {
      onChange([optionId]);
      return;
    }
    onChange(
      selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId],
    );
  };

  return (
    <View style={styles.base}>
      <View style={styles.titles}>
        <AppText variant="heading">{question.title}</AppText>
        {question.subtitle ? <AppText variant="secondary">{question.subtitle}</AppText> : null}
      </View>
      <View style={styles.options}>
        {question.options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            hint={option.hint}
            selected={selected.includes(option.id)}
            onPress={() => toggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: Spacing.four },
  titles: { gap: Spacing.two },
  options: { gap: Spacing.two + 2 },
});
