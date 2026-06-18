import * as Haptics from 'expo-haptics';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AddressStep } from '@/components/booking/address-step';
import { BookingSuccess } from '@/components/booking/booking-success';
import { DetailsStep } from '@/components/booking/details-step';
import { ProviderStep } from '@/components/booking/provider-step';
import { QuestionStep } from '@/components/booking/question-step';
import { ReviewStep } from '@/components/booking/review-step';
import { ScheduleStep } from '@/components/booking/schedule-step';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAddresses } from '@/lib/profile-store';
import type { LocalPhoto } from '@/lib/photo-upload';
import { isServiceId } from '@/lib/services';
import { useLocalizedService } from '@/lib/use-localized-service';
import { useAppStore } from '@/lib/store';
import type { BookingAnswer, ServiceId, TimeSlotId } from '@/lib/types';

const EXTRA_STEPS = ['details', 'address', 'schedule', 'provider', 'review'] as const;

export default function BookingWizardScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { service: serviceParam } = useLocalSearchParams<{ service: string }>();

  const createBooking = useAppStore((s) => s.createBooking);
  const addresses = useAddresses();

  // Hook must be called unconditionally — use a valid fallback until the guard runs
  const validId: ServiceId =
    serviceParam && isServiceId(serviceParam) ? serviceParam : 'plumber';
  const service = useLocalizedService(validId);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [addressId, setAddressId] = useState<string | null>(addresses[0]?.id ?? null);
  const [asap, setAsap] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<TimeSlotId | null>(null);
  // null = laisser TOCATO choisir (attribution automatique).
  const [providerId, setProviderId] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<{
    bookingId: string;
    conversationId: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!serviceParam || !isServiceId(serviceParam)) {
    return <Redirect href="/(tabs)/reserver" />;
  }

  const steps: string[] = [...service.questions.map((q) => q.id), ...EXTRA_STEPS];
  const currentStep = steps[stepIndex];
  const currentQuestion = service.questions.find((q) => q.id === currentStep);
  const selectedAddress = addresses.find((a) => a.id === addressId) ?? addresses[0];

  const isStepValid = (): boolean => {
    if (currentQuestion) {
      return Boolean(currentQuestion.optional) || (answers[currentQuestion.id] ?? []).length > 0;
    }
    switch (currentStep) {
      case 'details':
        return description.trim().length >= 10;
      case 'address':
        return selectedAddress != null;
      case 'schedule':
        return asap || (scheduledDate != null && timeSlot != null);
      default:
        return true;
    }
  };

  const buildAnswers = (): BookingAnswer[] =>
    service.questions
      .map((question) => ({
        questionId: question.id,
        questionLabel: question.title,
        values: (answers[question.id] ?? []).map(
          (optionId) => question.options.find((o) => o.id === optionId)?.label ?? optionId,
        ),
      }))
      .filter((answer) => answer.values.length > 0);

  const submit = async () => {
    if (!selectedAddress || submitting) return;
    setSubmitting(true);
    const ids = await createBooking({
      serviceId: service.id,
      answers: buildAnswers(),
      description: description.trim(),
      photos,
      address: selectedAddress,
      scheduledDate: asap ? undefined : (scheduledDate ?? undefined),
      timeSlot: asap ? undefined : (timeSlot ?? undefined),
      providerId: providerId ?? undefined,
    });
    setSubmitting(false);
    if (!ids) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSubmittedIds(ids);
  };

  const goNext = () => {
    if (currentStep === 'review') {
      void submit();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      router.back();
    }
  };

  const close = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    Alert.alert(t('wizard.abandonTitle'), t('wizard.abandonMessage'), [
      { text: t('wizard.continueRequest'), style: 'cancel' },
      { text: t('wizard.abandon'), style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (submittedIds) {
    return (
      <BookingSuccess
        bookingId={submittedIds.bookingId}
        conversationId={submittedIds.conversationId}
        serviceName={service.categoryName}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.progress}>
          <ProgressBar progress={(stepIndex + 1) / steps.length} />
        </View>
        <Pressable onPress={close} hitSlop={10} style={styles.headerButton}>
          <X size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {currentQuestion ? (
            <QuestionStep
              question={currentQuestion}
              selected={answers[currentQuestion.id] ?? []}
              onChange={(optionIds) =>
                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIds }))
              }
            />
          ) : null}

          {currentStep === 'details' ? (
            <DetailsStep
              description={description}
              onDescriptionChange={setDescription}
              photos={photos}
              onPhotosChange={setPhotos}
            />
          ) : null}

          {currentStep === 'address' ? (
            <AddressStep
              selectedAddressId={selectedAddress?.id ?? null}
              onSelect={setAddressId}
            />
          ) : null}

          {currentStep === 'schedule' ? (
            <ScheduleStep
              asap={asap}
              onAsapChange={setAsap}
              scheduledDate={scheduledDate}
              onDateChange={(date) => {
                setAsap(false);
                setScheduledDate(date);
              }}
              timeSlot={timeSlot}
              onTimeSlotChange={setTimeSlot}
            />
          ) : null}

          {currentStep === 'provider' ? (
            <ProviderStep
              serviceId={service.id}
              selectedId={providerId}
              onSelect={setProviderId}
            />
          ) : null}

          {currentStep === 'review' && selectedAddress ? (
            <ReviewStep
              service={service}
              answers={buildAnswers()}
              description={description}
              photoCount={photos.length}
              address={selectedAddress}
              asap={asap}
              scheduledDate={scheduledDate}
              timeSlot={timeSlot}
              providerId={providerId}
            />
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={currentStep === 'review' ? t('wizard.send') : t('wizard.next')}
            size="lg"
            onPress={goNext}
            disabled={!isStepValid()}
            loading={currentStep === 'review' && submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  headerButton: { padding: Spacing.one },
  progress: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five },
  footer: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
