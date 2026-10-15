import assert from 'node:assert/strict';
import {
  addPresentation,
  parseBulkRequest,
  quoteBulk,
  setBulkLine,
  resolveCartLine,
  cartLinePayload,
} from '../src/services/customer/cart.ts';

const product = { id: 'presentation-a', maxPresentations: 3 };
const initial = [];
const first = addPresentation(initial, product, 2);
assert.deepEqual(initial, []);
assert.deepEqual(first, [{ productId: product.id, quantity: 2 }]);
assert.equal(addPresentation(first, product, 1)[0].quantity, 3);
assert.throws(() => addPresentation(first, product, 2));
assert.throws(() => addPresentation([], { ...product, maxPresentations: 0 }, 1));
for (const amount of [0, -1, 0.5, NaN, Infinity]) {
  assert.throws(() => addPresentation([], product, amount));
}
assert.equal(addPresentation(first, { ...product, id: 'presentation-b' }, 1).length, 2);
console.log(
  'Cart checks passed: merge, immutable input, stock bounds, invalid quantities, distinct presentations.',
);

const bulk = {
  ...product,
  baseQuantity: 1000,
  priceCents: 1040,
  priceMode: 'proportional',
  isSealed: false,
  allowsQuantity: true,
  allowsMoney: true,
  minimumQuantity: 100,
  quantityStep: 50,
  availableQuantity: 2000,
};
assert.deepEqual(parseBulkRequest('money', '5,10'), { mode: 'money', value: 510 });
for (const text of ['1.001', '1x', '-2', 'Infinity', '1e3', '']) {
  assert.throws(() => parseBulkRequest('money', text));
}
assert.throws(() => parseBulkRequest('quantity', '1.5'));
assert.deepEqual(quoteBulk(bulk, { mode: 'quantity', value: 500 }), {
  quantity: 500,
  cents: 520,
  available: true,
});
assert.deepEqual(quoteBulk(bulk, { mode: 'money', value: 500 }), {
  quantity: 450,
  cents: 468,
  available: true,
});
assert.throws(() => quoteBulk(bulk, { mode: 'quantity', value: 501 }));
assert.throws(() => quoteBulk(bulk, { mode: 'money', value: 50 }));
assert.throws(() => quoteBulk({ ...bulk, allowsMoney: false }, { mode: 'money', value: 500 }));
assert.throws(() => quoteBulk({ ...bulk, isSealed: true }, { mode: 'quantity', value: 500 }));
assert.throws(() =>
  setBulkLine([], { ...bulk, availableQuantity: 0 }, { mode: 'quantity', value: 500 }),
);
const byWeight = setBulkLine([], bulk, { mode: 'quantity', value: 500 });
const byMoney = setBulkLine(byWeight, bulk, { mode: 'money', value: 500 });
assert.equal(byMoney.length, 1);
assert.equal(byWeight[0].bulk.mode, 'quantity');
assert.equal(resolveCartLine(bulk, byMoney[0]).product.priceCents, 468);
assert.equal(
  resolveCartLine({ ...bulk, availableQuantity: 0 }, byMoney[0]).product.maxPresentations,
  0,
);
assert.equal(
  resolveCartLine({ ...bulk, allowsMoney: false }, byMoney[0]).product.maxPresentations,
  0,
);
assert.deepEqual(cartLinePayload(byMoney[0]), {
  presentation_id: product.id,
  request_mode: 'money',
  requested_quantity: null,
  requested_money_cents: 500,
});
assert.throws(() => addPresentation(byMoney, bulk, 1));
// Property check across budgets: estimates cannot exceed the requested amount,
// must respect the step, and must follow the server's integer rounding formula.
for (let budget = 104; budget < 2000; budget += 7) {
  const quote = quoteBulk(bulk, { mode: 'money', value: budget });
  assert.ok(quote.cents <= budget);
  assert.equal(quote.quantity % 50, 0);
  assert.equal(quote.quantity, Math.floor(Math.floor((budget * 1000) / 1040) / 50) * 50);
}
console.log(
  'Bulk checks passed: parsing, rounding, budget, minimum, step, stock, permissions, replacement and payload.',
);
