import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}
const parser = load('src/services/customer/cartPersistence.ts');
const cart = load('src/services/customer/cartStorage.ts', { './cartPersistence': parser });
const values = new Map();
let failWrite = false;
const storage = {
  getItem: async (key) => values.get(key) ?? null,
  setItem: async (key, value) => {
    assert.ok(Buffer.byteLength(value, 'utf8') <= 2048);
    if (failWrite) {
      failWrite = false;
      throw new Error('Interrupted storage write');
    }
    values.set(key, value);
  },
  removeItem: async (key) => {
    values.delete(key);
  },
};
const lines = Array.from({ length: 100 }, (_, index) => ({
  productId: `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`,
  quantity: index + 1,
}));
await cart.writeStoredCart(storage, 'cart.store.customerA', lines);
assert.equal(
  JSON.stringify(await cart.readStoredCart(storage, 'cart.store.customerA')),
  JSON.stringify(lines),
);
assert.ok(JSON.parse(values.get('cart.store.customerA')).chunks > 1);
const other = [{ ...lines[0], quantity: 1, bulk: { mode: 'money', value: 110 } }];
await cart.writeStoredCart(storage, 'cart.store.customerB', other);
assert.equal(
  JSON.stringify(await cart.readStoredCart(storage, 'cart.store.customerB')),
  JSON.stringify(other),
);
failWrite = true;
await assert.rejects(cart.writeStoredCart(storage, 'cart.store.customerA', []), /Interrupted/);
assert.equal(
  JSON.stringify(await cart.readStoredCart(storage, 'cart.store.customerA')),
  JSON.stringify(lines),
);
await cart.clearStoredCart(storage, 'cart.store.customerA');
assert.equal(JSON.stringify(await cart.readStoredCart(storage, 'cart.store.customerA')), '[]');
assert.equal(
  JSON.stringify(await cart.readStoredCart(storage, 'cart.store.customerB')),
  JSON.stringify(other),
);
assert.ok(![...values.keys()].some((key) => key.startsWith('cart.store.customerA')));
values.set('legacy', parser.serializeCart(other));
assert.equal(JSON.stringify(await cart.readStoredCart(storage, 'legacy')), JSON.stringify(other));
assert.throws(() =>
  parser.parseSavedCart(JSON.stringify({ version: 1, lines: [lines[0], lines[0]] })),
);
assert.throws(() =>
  parser.parseSavedCart(
    JSON.stringify({ version: 1, lines: [{ ...other[0], bulk: { mode: 'money', value: 1.5 } }] }),
  ),
);
assert.throws(() => parser.parseSavedCart('{'));
assert.throws(() =>
  parser.parseSavedCart(JSON.stringify({ version: 1, lines: [{ ...lines[0], quantity: 0 }] })),
);
const merged = parser.mergeSavedCart(
  [lines[0], lines[1]],
  [{ ...lines[0], quantity: 5 }, lines[2]],
);
assert.equal(merged.length, 3);
assert.equal(merged[0].quantity, 5);
console.log(
  'Customer cart continuity: chunked restore, account isolation, interrupted write recovery, cleanup and invalid data checks passed.',
);
