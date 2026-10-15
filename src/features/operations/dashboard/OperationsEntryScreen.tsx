import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { operationsEntryContent } from './operationsContent';
import { sendOperationsCode, verifyOperationsCode } from '@/services/operations/access';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';

const backIcon = require('../../../assets/navigation/back.svg');

function sendCodeErrorMessage(error: unknown) {
  // Auth devuelve 5xx si falla la entrega SMTP; no culpar al correo del usuario.
  const status =
    typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  if (typeof status === 'number' && status >= 500) {
    return 'El servicio de correo no pudo enviar el código. Inténtalo más tarde.';
  }
  if (status === 429) {
    return 'Se alcanzó el límite de intentos. Espera un momento antes de volver a solicitarlo.';
  }
  return 'No pudimos enviar el código. Comprueba la conexión e inténtalo de nuevo.';
}

// 01 · Entra a tu tienda: credenciales del equipo (correo de trabajo).
// Sin fotografía decorativa, según las decisiones del usuario.
export function OperationsEntryScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { refresh } = useOperationsStore();
  const otpReady = process.env.EXPO_PUBLIC_OPERATIONS_EMAIL_OTP_READY === 'true';
  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const continueAccess = async () => {
    if (!otpReady || busy || !emailValid || (sent && code.trim().length < 6)) return;
    setBusy(true);
    setError('');
    try {
      if (!sent) {
        await sendOperationsCode(email);
        setSent(true);
      } else {
        const stores = await verifyOperationsCode(email, code);
        await refresh();
        if (!stores.length) {
          setError('Este correo no tiene una membresía owner/admin activa.');
        } else {
          router.replace('/operations-select');
        }
      }
    } catch (accessError) {
      setError(
        sent
          ? 'El código no es válido o venció. Solicita otro.'
          : sendCodeErrorMessage(accessError),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Image source={backIcon} tintColor={colors.primary} style={styles.backIcon} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.brand}>{operationsEntryContent.brand}</AppText>

        <AppText style={styles.eyebrow}>{operationsEntryContent.eyebrow}</AppText>
        <AppText style={styles.title} accessibilityRole="header">
          {operationsEntryContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {operationsEntryContent.subtitle}
        </AppText>

        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>{operationsEntryContent.emailLabel}</AppText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={operationsEntryContent.emailPlaceholder}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel={operationsEntryContent.emailLabel}
            style={styles.input}
          />
        </View>

        {sent && (
          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>CÓDIGO DEL CORREO</AppText>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accessibilityLabel="Código de acceso de seis dígitos"
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <AppText secondary>Introduce el código enviado a {email.trim()}.</AppText>
          </View>
        )}
        {!!error && (
          <AppText
            style={{ color: colors.danger, marginTop: spacing.md }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        )}
        {!otpReady && (
          <AppText secondary style={{ marginTop: spacing.md }}>
            El acceso por código estará disponible cuando el correo OTP de Cogana esté configurado
            en Supabase.
          </AppText>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sent ? 'Verificar y continuar' : 'Enviar código de acceso'}
          accessibilityState={{
            disabled: !otpReady || !emailValid || busy || (sent && code.trim().length < 6),
          }}
          onPress={() => void continueAccess()}
          style={({ pressed }) => [
            styles.continueButton,
            (!otpReady || !emailValid || busy || (sent && code.trim().length < 6)) &&
              styles.continueDisabled,
            pressed && !busy && styles.pressed,
          ]}
        >
          <AppText
            style={[
              styles.continueText,
              (!otpReady || !emailValid || busy || (sent && code.trim().length < 6)) &&
                styles.continueTextDisabled,
            ]}
          >
            {busy ? 'Espera un momento…' : sent ? 'Verificar y continuar' : 'Enviar código'}
          </AppText>
        </Pressable>
        <AppText style={styles.caption}>{operationsEntryContent.caption}</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  brand: { fontFamily: fonts.brandBold, fontSize: 28, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
    marginTop: spacing.xl,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 32,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  fieldGroup: { marginTop: spacing.xl, gap: spacing.sm },
  fieldLabel: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 44,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  continueButton: {
    marginTop: spacing.xl,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  continueDisabled: { backgroundColor: colors.surfaceMuted },
  pressed: { opacity: 0.85 },
  continueText: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  continueTextDisabled: { color: colors.textSecondary },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
