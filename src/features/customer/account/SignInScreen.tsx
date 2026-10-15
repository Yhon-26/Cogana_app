import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import { signInContent } from './signInContent';
import {
  requestCustomerCode,
  verifyCustomerCode,
  type CustomerAuthChannel,
} from '@/services/customer/auth';

const backIcon = require('../../../assets/navigation/back.svg');

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [channel, setChannel] = useState<CustomerAuthChannel>('email');
  const [identity, setIdentity] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const submit = async (resend = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      if (identity && !resend) {
        await verifyCustomerCode(channel, identity, code);
        if (router.canGoBack()) router.back();
        else router.replace('/store');
      } else {
        if (remaining > 0) return;
        const sentTo = await requestCustomerCode(channel, identity ?? phone);
        setIdentity(sentTo);
        setCode('');
        setNow(Date.now());
        setRetryAt(Date.now() + 60000);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos completar el acceso.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: Math.max(12, 63 - insets.top) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={styles.back}
              >
                <Image source={backIcon} style={styles.backIcon} accessible={false} />
              </Pressable>
              <AppText style={styles.headerTitle}>{signInContent.header}</AppText>
            </View>

            {/* Intentional Figma 687:48 change: omit the decorative photo so the access task stays focused. */}
            <View style={styles.intro}>
              <AppText accessibilityRole="header" style={styles.title}>
                {signInContent.title}
              </AppText>
              <AppText style={styles.description}>{signInContent.description}</AppText>
            </View>

            <View style={styles.form}>
              {!identity && (
                <View style={styles.channels}>
                  {(['email', 'phone'] as const).map((item) => (
                    <Pressable
                      key={item}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: channel === item, disabled: busy }}
                      disabled={busy}
                      onPress={() => {
                        setChannel(item);
                        setPhone('');
                        setError('');
                      }}
                      style={[styles.channel, channel === item && styles.channelSelected]}
                    >
                      <AppText>{item === 'email' ? 'Correo' : 'Celular'}</AppText>
                    </Pressable>
                  ))}
                </View>
              )}
              {identity && (
                <AppText style={styles.helper}>Escribe el código enviado a {identity}.</AppText>
              )}
              <AppText nativeID="phone-label" style={styles.fieldLabel}>
                {identity
                  ? 'CÓDIGO DE ACCESO'
                  : channel === 'email'
                    ? 'CORREO ELECTRÓNICO'
                    : signInContent.phoneLabel}
              </AppText>
              <View style={[styles.inputLine, focused && styles.inputLineFocused]}>
                <TextInput
                  value={identity ? code : phone}
                  onChangeText={identity ? setCode : setPhone}
                  editable={!busy}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={
                    identity
                      ? 'Código recibido'
                      : channel === 'email'
                        ? 'tu@correo.com'
                        : signInContent.phonePlaceholder
                  }
                  placeholderTextColor={colors.textSecondary}
                  keyboardType={
                    identity ? 'number-pad' : channel === 'email' ? 'email-address' : 'phone-pad'
                  }
                  maxLength={identity ? 8 : channel === 'email' ? 254 : 20}
                  returnKeyType="done"
                  selectionColor={colors.primary}
                  accessibilityLabel={
                    identity
                      ? 'Código de acceso'
                      : channel === 'email'
                        ? 'Correo electrónico'
                        : 'Celular'
                  }
                  style={styles.input}
                />
              </View>
              {error ? (
                <AppText style={styles.helper} accessibilityLiveRegion="assertive">
                  {error}
                </AppText>
              ) : (
                <AppText style={styles.helper}>
                  Usa siempre el mismo correo o celular para consultar tus pedidos.
                </AppText>
              )}
            </View>

            <View style={styles.actions}>
              <Button
                label={busy ? 'Procesando…' : identity ? 'Verificar código' : 'Enviar código'}
                size="form"
                disabled={
                  busy || (identity ? !/^\d{6,8}$/.test(code) : !phone.trim() || remaining > 0)
                }
                onPress={() => void submit()}
              />
              {identity && (
                <>
                  <Button
                    label={remaining ? `Reenviar en ${remaining} s` : 'Reenviar código'}
                    variant="ghost"
                    disabled={busy || remaining > 0}
                    onPress={() => void submit(true)}
                  />
                  <Button
                    label="Cambiar correo o celular"
                    variant="ghost"
                    disabled={busy}
                    onPress={() => {
                      setIdentity(null);
                      setCode('');
                      setError('');
                    }}
                  />
                </>
              )}
              {!identity && remaining > 0 && (
                <AppText style={styles.helper}>Podrás pedir otro código en {remaining} s.</AppText>
              )}
              <Pressable
                onPress={() => router.replace('/store')}
                accessibilityRole="button"
                accessibilityHint="Abre la tienda para explorar sin iniciar sesión"
                style={styles.guest}
              >
                <AppText style={styles.guestText}>{signInContent.guestAction}</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/operations')}
                hitSlop={8}
                style={styles.teamEntry}
              >
                <AppText style={styles.teamEntryText}>Acceso de equipo</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  channels: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  channel: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  channelSelected: { borderColor: colors.primary, backgroundColor: '#EDF4EF' },
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.page, paddingBottom: spacing.section },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  header: { height: 48, flexDirection: 'row', alignItems: 'center' },
  back: { width: 48, height: 48, marginRight: -4, alignItems: 'center', justifyContent: 'center' },
  backIcon: { width: 24, height: 24 },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  intro: { marginTop: spacing.section },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  description: { marginTop: 6, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  form: { marginTop: spacing.section },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  inputLine: { height: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  inputLineFocused: { borderBottomColor: colors.primary, borderBottomWidth: 2 },
  input: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  helper: { marginTop: 12, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  actions: { marginTop: spacing.section },
  guest: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  teamEntry: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  teamEntryText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  guestText: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.primary },
});
