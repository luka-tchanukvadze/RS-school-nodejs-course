import { createReadStream } from 'node:fs';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolvePath } from '../utils/pathResolver.js';

const ALGOS = ['sha256', 'md5', 'sha512'];

export const hashCompare = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const hashPath = resolvePath(cwd, args.hash);
  const algo = args.algorithm || 'sha256';

  if (!ALGOS.includes(algo)) throw new Error('unsupported algorithm');
  await access(inPath);
  await access(hashPath);

  const expected = (await readFile(hashPath, 'utf-8')).trim();

  const actual = await new Promise((res, rej) => {
    const h = createHash(algo);
    const stream = createReadStream(inPath);
    stream.on('data', (c) => h.update(c));
    stream.on('end', () => res(h.digest('hex')));
    stream.on('error', rej);
  });

  if (actual.toLowerCase() === expected.toLowerCase()) {
    console.log('OK');
  } else {
    console.log('MISMATCH');
  }
};
