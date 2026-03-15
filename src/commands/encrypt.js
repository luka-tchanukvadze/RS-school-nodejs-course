import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

export const encrypt = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const outPath = resolvePath(cwd, args.output);
  const password = args.password;

  await access(inPath);

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const outStream = createWriteStream(outPath);

  // write salt and iv as header
  outStream.write(salt);
  outStream.write(iv);

  const inStream = createReadStream(inPath);

  await new Promise((res, rej) => {
    inStream.pipe(cipher);
    cipher.pipe(outStream, { end: false });

    cipher.on('end', () => {
      // append auth tag after all ciphertext
      outStream.write(cipher.getAuthTag());
      outStream.end();
    });

    outStream.on('finish', res);
    inStream.on('error', rej);
    cipher.on('error', rej);
    outStream.on('error', rej);
  });
};
