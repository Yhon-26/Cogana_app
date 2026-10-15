import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { addressesContent } from './addressesContent';
import { loadCustomerAccount, saveCustomerAccount } from '@/services/customer/account';
import { useOrderAction } from '@/features/operations/useOrderAction';
import { Button } from '@/components/Button';

const backIcon = require('../../../assets/navigation/back.svg');

// 23 · Nueva dirección: formulario plano de Figma con etiquetas en mayúsculas.
// Los campos viven en el estado local de la pantalla; el guardado permanece
// deshabilitado porque las direcciones pertenecen a una cuenta de cliente.
export function NewAddressScreen() {
  const [isPrimary, setIsPrimary] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [reference, setReference] = useState('');
  const action = useOrderAction(() => router.back());
  const payload = {
    address: {
      label: label.trim(),
      address_line: address.trim(),
      district: district.trim(),
      reference: reference.trim(),
      is_default: isPrimary,
    },
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
        <AppText style={styles.topBarTitle} accessibilityRole="header">
          {addressesContent.formTopBar}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>{addressesContent.formTitle}</AppText>
        <AppText secondary style={styles.subtitle}>
          {addressesContent.formSubtitle}
        </AppText>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{addressesContent.labelTag}</AppText>
            <TextInput
              placeholder={addressesContent.placeholderTag}
              value={label}
              onChangeText={setLabel}
              editable={!action.busy}
              maxLength={60}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              accessibilityLabel={addressesContent.labelTag}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{addressesContent.labelAddress}</AppText>
            <TextInput
              placeholder={addressesContent.placeholderAddress}
              value={address}
              onChangeText={setAddress}
              editable={!action.busy}
              maxLength={250}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              accessibilityLabel={addressesContent.labelAddress}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{addressesContent.labelDistrict}</AppText>
            <TextInput
              placeholder={addressesContent.placeholderDistrict}
              value={district}
              onChangeText={setDistrict}
              editable={!action.busy}
              maxLength={80}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              accessibilityLabel={addressesContent.labelDistrict}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{addressesContent.labelReference}</AppText>
            <TextInput
              placeholder={addressesContent.placeholderReference}
              value={reference}
              onChangeText={setReference}
              editable={!action.busy}
              maxLength={250}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              accessibilityLabel={addressesContent.labelReference}
              style={styles.input}
            />
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isPrimary }}
            accessibilityLabel={addressesContent.primaryCheckbox}
            onPress={() => setIsPrimary((value) => !value)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, isPrimary && styles.checkboxChecked]}>
              {isPrimary && <View style={styles.checkboxMark} />}
            </View>
            <AppText style={styles.checkboxLabel}>{addressesContent.primaryCheckbox}</AppText>
          </Pressable>

          {action.error && <AppText accessibilityLiveRegion="assertive">{action.error}</AppText>}
          <Button
            label={action.busy ? 'Guardando…' : addressesContent.saveCta}
            disabled={action.busy || !label.trim() || !address.trim() || !district.trim()}
            onPress={() =>
              void action.run(JSON.stringify(payload), async (operationId) => {
                const account = await loadCustomerAccount();
                await saveCustomerAccount(account.storeId, payload, operationId);
              })
            }
          />
          <Button
            label="Completar mis datos de cuenta"
            variant="ghost"
            onPress={() => router.push('/preferences')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  topBarTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.touchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    width: 10,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.onPrimary,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  checkboxLabel: { fontSize: 14, lineHeight: 19 },
  saveButton: {
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  saveNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
