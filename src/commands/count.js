import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolvePath } from '../utils/pathResolver.js';

export const count = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  await access(inPath);

  let lines = 0;
  let words = 0;
  let chars = 0;
  let rest = '';

  await new Promise((res, rej) => {
    const stream = createReadStream(inPath, { encoding: 'utf-8' });

    stream.on('data', (chunk) => {
      chars += chunk.length;
      const text = rest + chunk;
      const parts = text.split('\n');
      rest = parts.pop();

      for (const part of parts) {
        lines++;
        const ws = part.trim().split(/\s+/).filter(Boolean);
        words += ws.length;
      }
    });

    stream.on('end', () => {
      // handle last line if file doesnt end with newline
      if (rest.length > 0) {
        lines++;
        const ws = rest.trim().split(/\s+/).filter(Boolean);
        words += ws.length;
      }
      res();
    });

    stream.on('error', rej);
  });

  console.log(`Lines: ${lines}`);
  console.log(`Words: ${words}`);
  console.log(`Characters: ${chars}`);
};
