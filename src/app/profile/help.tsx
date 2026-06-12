import { ChevronDown, ChevronUp, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FAQ = [
  {
    question: 'Comment se passe une réservation ?',
    answer:
      'Vous décrivez votre besoin en répondant à quelques questions, puis un prestataire vérifié vous envoie un devis dans le chat. Vous acceptez le devis quand il vous convient — la réservation est alors confirmée.',
  },
  {
    question: 'Quand est-ce que je paie ?',
    answer:
      'Toujours après avoir accepté le devis, jamais avant. Le prix convenu dans le chat est le prix final — pas de frais cachés.',
  },
  {
    question: 'Puis-je annuler une réservation ?',
    answer:
      'Oui, depuis la page de la réservation, tant que la prestation n’a pas commencé. Le prestataire est automatiquement prévenu dans le chat.',
  },
  {
    question: 'Les prestataires sont-ils vérifiés ?',
    answer:
      'Oui : identité, certifications professionnelles (ex. CMMTQ pour les plombiers) et avis clients sont vérifiés avant qu’un prestataire rejoigne TOCATO.',
  },
  {
    question: 'Dans quelles villes TOCATO est-il disponible ?',
    answer:
      'TOCATO est lancé dans le Grand Montréal. D’autres villes du Québec suivront bientôt !',
  },
];

export default function HelpScreen() {
  const colors = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageHeader title="Aide" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.faqList}>
          {FAQ.map((item, index) => {
            const open = openIndex === index;
            return (
              <Card key={item.question}>
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
            Vous ne trouvez pas votre réponse ?
          </AppText>
          <Button
            title="Écrire au support"
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
