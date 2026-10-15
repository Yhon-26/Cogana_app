import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/app/+native-intent.tsx', 'utf8');
const exports = {};
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports },
);
const redirect = (path) => exports.redirectSystemPath({ path, initial: true });
for (const path of [
  'cogana://payment/pending?orderId=00000000-0000-4000-8000-000000000001',
  'exp://10.0.2.2:8081/--/sign-in',
  '/search?q=lim%C3%B3n',
])
  assert.equal(redirect(path), path);
for (const path of ['/search?q=%FF', '/search?q=%', '/search?q=%C2'.repeat(1000)]) {
  assert.equal(redirect(path), '/');
}
assert.equal(exports.redirectSystemPath({ path: '/search?q=%FF', initial: false }), '/');
console.log('Security deep-link regression checks passed.');
