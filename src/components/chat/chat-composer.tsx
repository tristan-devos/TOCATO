import { Lock, Paperclip, SendHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { Font, FontSize, Radius, Spacing } from '@/constants/theme';
import { useFormats } from '@/hooks/use-formats';
import { useTheme } from '@/hooks/use-theme';
import type { ConversationState } from '@/lib/conversation-state';

interface ChatComposerProps {
  state: ConversationState;
  onSend: (text: string) => void;
}

/**
 * Zone de saisie du chat ; bandeau à la place quand la conversation est fermée
 * (mission terminée depuis 48 h, annulée, autre prestataire retenu).
 */
export function ChatComposer({ state, onSend }: ChatComposerProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { formatDateLong, formatTime } = useFormats();
  const [draft, setDraft] = useState('');
  const bar = { borderTopColor: colors.border, backgroundColor: colors.card };

  if (!state.open) {
    return (
      <View style={[styles.closed, bar]}>
        <Lock size={16} color={colors.textSecondary} />
        <AppText variant="secondary" style={styles.flex}>
          {t(`chat.closed.${state.reason}`)}
        </AppText>
      </View>
    );
  }

  const canSend = draft.trim().length > 0;
  const send = () => {
    onSend(draft);
    setDraft('');
  };

  return (
    <View style={[styles.wrapper, bar]}>
      {state.closesAt ? (
        <AppText variant="small" style={styles.notice}>
          {t('chat.closesAt', {
            date: formatDateLong(state.closesAt.toISOString()),
            time: formatTime(state.closesAt.toISOString()),
          })}
        </AppText>
      ) : null}
      <View style={styles.inputBar}>
        <Pressable
          onPress={() => Alert.alert(t('chat.attachTitle'), t('chat.attachMessage'))}
          hitSlop={8}
          style={styles.attachButton}>
          <Paperclip size={20} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          hitSlop={8}
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? colors.primary : colors.backgroundElement },
          ]}>
          <SendHorizontal
            size={18}
            color={canSend ? colors.onPrimary : colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrapper: { borderTopWidth: StyleSheet.hairlineWidth },
  notice: { textAlign: 'center', paddingTop: Spacing.two },
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  attachButton: { padding: Spacing.two, paddingBottom: 12 },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 10,
    ...Font.regular,
    fontSize: FontSize.base,
    maxHeight: 110,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
