import { ChevronDown, ChevronUp, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HelpScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faq = Array.from({ length: 5 }, (_, i) => ({
    question: t(`help.faq${i}q`),
    answer: t(`help.faq${i}a`),
  }));

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title={t('help.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.faqList}>
          {faq.map((item, index) => {
            const open = openIndex === index;
            return (
              <Card key={index}>
                <Pressable
                  onPress={() => setOpenIndex(open ? null : index)}
                  style={styles.questionRow}>
                  <AppText variant="label" style={styles.question}>
                    {item.question}
                  </AppText>
                  {open ? (
                    <ChevronUp size={18} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={colors.textSecondary} />
                  )}
                </Pressable>
                {open ? (
                  <AppText variant="secondary" style={styles.answer}>
                    {item.answer}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
        </View>

        <View style={styles.contact}>
          <AppText variant="secondary" style={styles.contactText}>
            {t('help.contactPrompt')}
          </AppText>
          <Button
            title={t('help.contactButton')}
            variant="secondary"
            icon={<Mail size={16} color={colors.primary} />}
            onPress={() => Linking.openURL('mailto:support@tocato.ca')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },
  faqList: { gap: Spacing.two + 4 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  question: { flex: 1 },
  answer: { marginTop: Spacing.two + 4 },
  contact: { gap: Spacing.three, alignItems: 'center' },
  contactText: { textAlign: 'center' },
});
