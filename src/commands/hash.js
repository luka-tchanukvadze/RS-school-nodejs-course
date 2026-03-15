import { createReadStream } from 'node:fs';
import { access, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolvePath } from '../utils/pathResolver.js';

const ALGOS = ['sha256', 'md5', 'sha512'];

export const hash = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const algo = args.algorithm || 'sha256';

  if (!ALGOS.includes(algo)) throw new Error('unsupported algorithm');
  await access(inPath);

  const hashVal = await new Promise((res, rej) => {
    const h = createHash(algo);
    const stream = createReadStream(inPath);
    stream.on('data', (c) => h.update(c));
    stream.on('end', () => res(h.digest('hex')));
    stream.on('error', rej);
  });

  console.log(`${algo}: ${hashVal}`);

  if (args.save) {
    await writeFile(`${inPath}.${algo}`, hashVal);
  }
};
