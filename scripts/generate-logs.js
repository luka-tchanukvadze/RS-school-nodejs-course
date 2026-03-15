import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const levels = ['INFO', 'WARN', 'ERROR'];
const services = ['user-service', 'auth-service', 'order-service', 'payment-service'];
const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const paths = ['/api/users', '/api/orders', '/api/products', '/api/auth', '/api/payments'];
const codes = [200, 201, 301, 400, 401, 403, 404, 500, 502, 503];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const args = process.argv.slice(2);
const outIdx = args.indexOf('--output');
const linesIdx = args.indexOf('--lines');
const outFile = outIdx !== -1 ? args[outIdx + 1] : 'logs.txt';
const numLines = linesIdx !== -1 ? Number(args[linesIdx + 1]) : 100000;

await mkdir(dirname(resolve(outFile)), { recursive: true });

const stream = createWriteStream(outFile);

for (let i = 0; i < numLines; i++) {
  const ts = new Date(Date.now() - Math.random() * 86400000 * 30).toISOString();
  const rt = Math.floor(Math.random() * 500);
  const line = `${ts} ${pick(levels)} ${pick(services)} ${pick(codes)} ${rt} ${pick(methods)} ${pick(paths)}\n`;

  if (!stream.write(line)) {
    await new Promise((r) => stream.once('drain', r));
  }
}

stream.end();
await new Promise((r) => stream.on('finish', r));
console.log(`generated ${numLines} lines in ${outFile}`);
