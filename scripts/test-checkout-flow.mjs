import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real provider's transitions with synchronous hooks, without Auth or storage I/O.
const state = [];
let cursor = 0;
const react = {
  createContext: () => ({ Provider: 'CheckoutDraftProvider' }),
  useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [
      state[index],
      (value) => {
        state[index] = typeof value === 'function' ? value(state[index]) : value;
      },
    ];
  },
  useRef: (current) => ({ current }),
  useCallback: (callback) => callback,
  useMemo: (callback) => callback(),
  useEffect: () => {},
};
const dependencies = {
  react,
  'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  '@/services/customer/cart': {},
  '@/services/customer/catalog': {},
  '@/services/customer/checkoutSchedule': { customerStoreSlug: 'test-store' },
  '@/services/customer/auth': {},
  '@/services/supabase/storage': {},
  '@/services/customer/cartStorage': {},
  '@/services/customer/cartPersistence': {},
};
const exports = {};
const code = ts.transpileModule(
  readFileSync('src/features/customer/checkout/CheckoutDraftContext.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
vm.runInNewContext(code, {
  exports,
  require(name) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  },
});
function render() {
  cursor = 0;
  return exports.CheckoutDraftProvider({ children: null }).props.value;
}
let draft = render();
assert.equal(draft.fulfillmentMode, 'delivery');
const deliverySlot = { mode: 'delivery', starts_at: '2030-01-01T12:00:00Z' };
const pickupSlot = { mode: 'pickup', starts_at: '2030-01-01T12:00:00Z' };
draft.setSelectedSlot(deliverySlot);
draft.setPaymentMethod('yape');
draft.setDeliveryField('address', 'Saved address');
draft.setFulfillmentMode('delivery');
draft = render();
assert.equal(draft.selectedSlot, deliverySlot);
assert.equal(draft.paymentMethod, 'yape');
draft.setFulfillmentMode('pickup');
draft = render();
assert.equal(draft.fulfillmentMode, 'pickup');
assert.equal(draft.selectedSlot, null);
assert.equal(draft.paymentMethod, 'yape');
assert.equal(draft.delivery.address, 'Saved address');
draft.setSelectedSlot(pickupSlot);
draft.setPaymentMethod('cash');
draft.setFulfillmentMode('pickup');
draft = render();
assert.equal(draft.selectedSlot, pickupSlot);
assert.equal(draft.paymentMethod, 'cash');
draft.setFulfillmentMode('delivery');
draft = render();
assert.equal(draft.selectedSlot, null);
assert.equal(draft.paymentMethod, null);
assert.equal(draft.delivery.address, 'Saved address');
draft.setFulfillmentMode('pickup');
draft.resetCheckoutDraft();
draft = render();
assert.equal(draft.fulfillmentMode, 'delivery');
assert.equal(draft.delivery.address, '');
assert.equal(draft.cartLines.length, 0);
console.log(
  'Checkout flow: compatible preferences retained, incompatible slot/cash cleared, address retained between modes, reset verified. No network calls.',
);
