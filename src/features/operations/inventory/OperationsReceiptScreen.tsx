import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { formatSoles } from '@/features/customer/products/formatPrice';
import { loadOperationsCatalog } from '@/services/operations/data';
import {
  receiveInventoryLot,
  validateReceiveLot,
  type SealedPackageInput,
} from '@/services/operations/inventory';
import { colors, fonts, spacing } from '@/theme/tokens';
import { OperationsInventoryPage } from './OperationsInventoryComponents';

type Catalog = Awaited<ReturnType<typeof loadOperationsCatalog>>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function lotCodeSuggestion() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `L-${now.getFullYear()}${month}${day}`;
}

function looseUnitLabel(baseUnit: string) {
  if (baseUnit === 'gram') return 'gramos';
  if (baseUnit === 'milliliter') return 'mililitros';
  return 'unidades';
}

function parseCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

// Registrar entrada: crea un lote nuevo con existencias sueltas (granel) y/o
// paquetes sellados por presentación. La RPC registra el movimiento 'receipt'
// de forma idempotente; el operation_id se conserva entre reintentos y se
// renueva después de un registro exitoso.
export function OperationsReceiptScreen({ id }: { id?: string }) {
  const { store } = useOperationsStore();
  const [data, setData] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);
  const [lotCode, setLotCode] = useState(lotCodeSuggestion);
  const [expiresOn, setExpiresOn] = useState('');
  const [looseText, setLooseText] = useState('');
  const [sealedText, setSealedText] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{
    lotCode: string;
    loose: number;
    sealed: number;
    unit: string;
  } | null>(null);
  const operation = useRef<string | null>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (!store) return;
    let active = true;
    void loadOperationsCatalog(store.id)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store]);

  const product = data?.products.find(
    (item) => item.id === id || data.presentations.some((p) => p.id === id && p.product_id === item.id),
  );
  const sealedPresentations = data?.presentations.filter(
    (item) => item.product_id === product?.id && item.is_sealed && item.is_active,
  );

  const loose = parseCount(looseText) ?? 0;
  const sealedPackages: SealedPackageInput[] = Object.entries(sealedText)
    .map(([presentationId, value]) => ({ presentation_id: presentationId, units: parseCount(value) ?? 0 }))
    .filter((item) => item.units > 0);
  const sealedTotal = sealedPackages.reduce((sum, item) => sum + item.units, 0);

  const submit = async () => {
    if (!store || !product || sending.current) return;
    setFormError('');
    if (!DATE_PATTERN.test(expiresOn) && expiresOn.trim()) {
      setFormError('Escribe el vencimiento como AAAA-MM-DD o déjalo vacío.');
      return;
    }
    const validationError = validateReceiveLot({
      storeId: store.id,
      productId: product.id,
      lotCode,
      looseQuantity: loose,
      sealed: sealedPackages,
      operationId: '',
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    sending.current = true;
    setBusy(true);
    operation.current ??= randomUUID();
    try {
      const receipt = await receiveInventoryLot({
        storeId: store.id,
        productId: product.id,
        lotCode,
        expiresOn: expiresOn.trim() ? expiresOn.trim() : null,
        looseQuantity: loose,
        sealed: sealedPackages,
        notes: notes.trim() ? notes.trim() : null,
        operationId: operation.current,
      });
      operation.current = null;
      setResult({
        lotCode: lotCode.trim(),
        loose: receipt.loose_quantity_added,
        sealed: receipt.sealed_units_added,
        unit: looseUnitLabel(product.base_unit),
      });
      setLooseText('');
      setSealedText({});
      setNotes('');
      setLotCode(lotCodeSuggestion());
    } catch (failure) {
      setFormError(
        failure instanceof Error ? failure.message : 'No pudimos registrar la entrada.',
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  return (
    <OperationsInventoryPage
      title="Registrar entrada"
      subtitle={store?.name ?? 'Tienda'}
      backLabel="Inventario"
      backDestinationLabel="Inventario"
    >
      {error ? (
        <AppText style={{ marginTop: spacing.xl }}>No pudimos cargar el producto.</AppText>
      ) : !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : !product ? (
        <AppText style={{ marginTop: spacing.xl }}>
          Elige un producto desde Inventario para registrar su entrada.
        </AppText>
      ) : (
        <>
          <AppText
            accessibilityRole="header"
            style={{ fontFamily: fonts.semibold, fontSize: 18, marginTop: spacing.xl }}
          >
            {product.name}
          </AppText>
          <AppText secondary style={{ marginTop: spacing.xs }}>
            {product.sku ? `SKU ${product.sku} · ` : ''}lote nuevo por producto
          </AppText>

          <AppText style={styles.fieldLabel}>CÓDIGO DE LOTE</AppText>
          <TextInput
            value={lotCode}
            onChangeText={setLotCode}
            editable={!busy}
            autoCorrect={false}
            accessibilityLabel="Código de lote"
            placeholder="Ej. L-20261003"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={styles.input}
          />

          <AppText style={styles.fieldLabel}>VENCIMIENTO · OPCIONAL</AppText>
          <TextInput
            value={expiresOn}
            onChangeText={setExpiresOn}
            editable={!busy}
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            accessibilityLabel="Fecha de vencimiento"
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={styles.input}
          />

          <AppText style={styles.fieldLabel}>
            {`CANTIDAD SUELTA · ${looseUnitLabel(product.base_unit).toUpperCase()}`}
          </AppText>
          <TextInput
            value={looseText}
            onChangeText={setLooseText}
            editable={!busy}
            keyboardType="number-pad"
            accessibilityLabel={`Cantidad suelta en ${looseUnitLabel(product.base_unit)}`}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={styles.input}
          />

          {sealedPresentations && sealedPresentations.length > 0 && (
            <>
              <AppText style={[styles.fieldLabel, { marginTop: spacing.xl }]}>
                PAQUETES SELLADOS
              </AppText>
              {sealedPresentations.map((item) => (
                <View key={item.id} style={styles.packageRow}>
                  <View style={styles.packageCopy}>
                    <AppText style={styles.packageName}>{item.name}</AppText>
                    <AppText secondary>
                      {`${item.base_quantity} ${looseUnitLabel(product.base_unit)} por paquete · ${formatSoles(item.price_cents)}`}
                    </AppText>
                  </View>
                  <TextInput
                    value={sealedText[item.id] ?? ''}
                    onChangeText={(value) =>
                      setSealedText((current) => ({ ...current, [item.id]: value }))
                    }
                    editable={!busy}
                    keyboardType="number-pad"
                    accessibilityLabel={`Paquetes sellados de ${item.name}`}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.primary}
                    style={[styles.input, styles.packageInput]}
                  />
                </View>
              ))}
            </>
          )}

          <AppText style={styles.fieldLabel}>NOTAS · OPCIONAL</AppText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            editable={!busy}
            multiline
            accessibilityLabel="Notas de la entrada"
            placeholder="Proveedor, observaciones…"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={[styles.input, styles.notesInput]}
          />

          {loose + sealedTotal > 0 && (
            <AppText secondary style={{ marginTop: spacing.md }}>
              {`Entrada: ${loose.toLocaleString('es-PE')} ${looseUnitLabel(product.base_unit)} sueltas${
                sealedTotal ? ` · ${sealedTotal.toLocaleString('es-PE')} paquetes sellados` : ''
              }`}
            </AppText>
          )}

          {formError ? (
            <AppText accessibilityLiveRegion="assertive" style={{ marginTop: spacing.md }}>
              {formError}
            </AppText>
          ) : null}

          <View style={{ marginTop: spacing.xl }}>
            <Button
              label={busy ? 'Registrando…' : 'Registrar entrada'}
              size="form"
              disabled={busy}
              onPress={() => void submit()}
            />
          </View>

          {result && (
            <View style={styles.resultPanel}>
              <AppText style={styles.resultTitle}>Entrada registrada</AppText>
              <AppText secondary>
                {`Lote ${result.lotCode} · ${result.loose.toLocaleString('es-PE')} ${result.unit} sueltas${
                  result.sealed ? ` · ${result.sealed.toLocaleString('es-PE')} paquetes sellados` : ''
                }`}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/inventario' as Href)}
                style={styles.resultLink}
              >
                <AppText style={styles.resultLinkText}>Ver inventario actualizado</AppText>
              </Pressable>
            </View>
          )}

          <View style={styles.notePanel}>
            <AppText secondary>
              El lote se crea disponible y su stock entra al catálogo público de inmediato. Los
              paquetes sellados se venden completos; ábrelos como granel cuando los necesites.
            </AppText>
          </View>
        </>
      )}
    </OperationsInventoryPage>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
    marginTop: spacing.xl,
  },
  input: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  notesInput: { minHeight: 88, textAlignVertical: 'top' },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  packageCopy: { flex: 1, minWidth: 0, gap: 2 },
  packageName: { fontFamily: fonts.semibold },
  packageInput: { marginTop: 0, width: 88, textAlign: 'center' },
  resultPanel: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  resultTitle: { fontFamily: fonts.semibold, color: colors.primary },
  resultLink: { minHeight: 48, justifyContent: 'center' },
  resultLinkText: { color: colors.primary, fontFamily: fonts.semibold },
  notePanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
});
