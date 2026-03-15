import { createDecipheriv, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, access } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export const decrypt = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const outPath = resolvePath(cwd, args.output);
  const password = args.password;

  await access(inPath);
  const { size } = await stat(inPath);

  // read salt (16 bytes) and iv (12 bytes) from start
  const header = await readChunk(inPath, 0, 28);
  const salt = header.subarray(0, 16);
  const iv = header.subarray(16, 28);

  // read auth tag (16 bytes) from end
  const authTag = await readChunk(inPath, size - 16, 16);

  const key = scryptSync(password, salt, 32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // decrypt the ciphertext (everything between header and auth tag)
  await pipeline(
    createReadStream(inPath, { start: 28, end: size - 17 }),
    decipher,
    createWriteStream(outPath),
  );
};

// helper to read a small chunk from a file using streams
const readChunk = (file, start, len) => {
  return new Promise((res, rej) => {
    const bufs = [];
    const s = createReadStream(file, { start, end: start + len - 1 });
    s.on('data', (c) => bufs.push(c));
    s.on('end', () => res(Buffer.concat(bufs)));
    s.on('error', rej);
  });
};
