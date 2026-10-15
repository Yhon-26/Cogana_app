import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createHash } from 'node:crypto';

function load(path, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    ...globals,
    exports,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}
const cart = load('src/services/customer/cart.ts');
const contract = load('src/services/customer/checkoutContract.ts', { './cart': cart });
const input = {
  storeId: 'store',
  mode: 'pickup',
  paymentMethod: 'cash',
  customer: { name: ' Cliente de prueba ', phone: '999 123 456' },
  scheduledFor: '2030-01-01T12:00:00Z',
  lines: [{ productId: 'presentation', quantity: 2 }],
};
const payload = contract.buildCheckoutPayload(input);
assert.equal(payload.customer.name, 'Cliente de prueba');
assert.equal(payload.customer.phone, '999123456');
assert.equal(payload.delivery_zone_id, null);
assert.equal(payload.items[0].requested_quantity, 2);
assert.equal('price_cents' in payload.items[0], false);
assert.throws(() => contract.buildCheckoutPayload({ ...input, mode: 'delivery' }));
assert.throws(() => contract.buildCheckoutPayload({ ...input, lines: [] }));
assert.throws(() =>
  contract.buildCheckoutPayload({ ...input, lines: [...input.lines, ...input.lines] }),
);
assert.throws(() => contract.parseCheckoutResult({ status: 'paid' }));
const memory = new Map();
let sequence = 0;
let calls = [];
let rpcResponse = { data: null, error: { code: '', message: 'Network request failed' } };
let recovered = null;
const query = {
  select() {
    return this;
  },
  eq() {
    return this;
  },
  async maybeSingle() {
    return { data: recovered, error: null };
  },
};
const client = {
  auth: {
    async getUser() {
      return { data: { user: { id: 'buyer' } }, error: null };
    },
  },
  from: () => query,
  async rpc(name, args) {
    calls.push({ name, args });
    return rpcResponse;
  },
};
const service = load('src/services/customer/checkout.ts', {
  'expo-crypto': {
    randomUUID: () => `operation-${++sequence}`,
    CryptoDigestAlgorithm: { SHA256: 'sha256' },
    digestStringAsync: async (_, value) => createHash('sha256').update(value).digest('hex'),
  },
  './auth': { getCustomerAuthClient: () => client },
  '../supabase/storage': {
    sessionStorage: {
      getItem: async (key) => memory.get(key) ?? null,
      setItem: async (key, value) => {
        memory.set(key, value);
      },
      removeItem: async (key) => {
        memory.delete(key);
      },
    },
  },
  './checkoutContract': contract,
});
await assert.rejects(service.submitCheckout(input));
await assert.rejects(service.submitCheckout(input));
assert.equal(calls[0].args.p_operation_id, calls[1].args.p_operation_id);
assert.equal(memory.size, 1);
await assert.rejects(
  service.submitCheckout({ ...input, lines: [{ productId: 'different', quantity: 1 }] }),
);
assert.equal(calls.length, 2);
recovered = {
  id: 'order',
  order_number: 'CG-TEST',
  status: 'pending_payment',
  payment_status: 'requires_action',
  estimated_total_cents: 3400,
};
const replay = await service.submitCheckout(input);
assert.equal(replay.orderId, 'order');
assert.equal(replay.replayed, true);
assert.equal(calls.length, 2);
await service.acknowledgeCheckout('store', 'order');
assert.equal(memory.has('checkout.buyer.store'), false);
assert.equal(memory.has('checkout.last.buyer'), true);
recovered = null;
rpcResponse = { data: null, error: { code: 'P0001', message: 'Stock insuficiente' } };
await assert.rejects(service.submitCheckout(input), /Stock insuficiente/);
assert.equal(memory.has('checkout.buyer.store'), false);
assert.equal(calls[0].name, 'submit_customer_order');
assert.equal('p_reservation_expires_at' in calls[0].args, false);
console.log(
  'Checkout checks passed: validation, price-free intent, stable retries, changed-cart guard, committed-order recovery, acknowledgement and atomic rejection.',
);

const otpCalls = [];
const customerAuth = load(
  'src/services/customer/auth.ts',
  {
    'react-native-url-polyfill/auto': {},
    '@supabase/supabase-js': {
      createClient: () => ({
        auth: {
          signInWithOtp: async (args) => {
            otpCalls.push(args);
            return { error: null };
          },
          verifyOtp: async (args) => {
            otpCalls.push(args);
            return { error: null };
          },
        },
      }),
    },
    '../config': {
      getSupabaseConfig: () => ({ url: 'https://test.invalid', publishableKey: 'public-test-key' }),
    },
    '../supabase/storage': { sessionStorage: {} },
  },
  {
    fetch: async () => ({
      ok: true,
      json: async () => ({ external: { email: true, phone: false } }),
    }),
  },
);
assert.equal(customerAuth.normalizeCustomerIdentity('phone', '969 789 624'), '+51969789624');
assert.equal(
  customerAuth.normalizeCustomerIdentity('email', ' TEST@EXAMPLE.COM '),
  'test@example.com',
);
assert.throws(() => customerAuth.normalizeCustomerIdentity('phone', '123'));
await assert.rejects(customerAuth.requestCustomerCode('phone', '969789624'), /SMS/);
assert.equal(otpCalls.length, 0);
await customerAuth.requestCustomerCode('email', 'test@example.com');
assert.equal(otpCalls[0].email, 'test@example.com');
await assert.rejects(customerAuth.verifyCustomerCode('email', 'test@example.com', 'bad'));
await customerAuth.verifyCustomerCode('email', 'test@example.com', '123456');
assert.equal(otpCalls[1].type, 'email');
console.log(
  'Customer auth checks passed: normalization, inactive SMS provider, email request and OTP validation. No real messages sent.',
);
