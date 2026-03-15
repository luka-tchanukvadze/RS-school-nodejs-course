import { createReadStream, createWriteStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export const csvToJson = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const outPath = resolvePath(cwd, args.output);

  await access(inPath);

  let headers = null;
  let isFirst = true;
  let rest = '';

  const transform = new Transform({
    transform(chunk, enc, cb) {
      const text = rest + chunk.toString();
      const lines = text.split('\n');
      rest = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (!headers) {
          headers = trimmed.split(',').map((h) => h.trim());
          this.push('[\n');
          continue;
        }

        const vals = trimmed.split(',').map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });

        if (!isFirst) this.push(',\n');
        isFirst = false;
        this.push('  ' + JSON.stringify(obj));
      }
      cb();
    },
    flush(cb) {
      if (rest && rest.trim() && headers) {
        const vals = rest.trim().split(',').map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        if (!isFirst) this.push(',\n');
        this.push('  ' + JSON.stringify(obj));
      }
      this.push(headers ? '\n]' : '[]');
      cb();
    },
  });

  await pipeline(
    createReadStream(inPath),
    transform,
    createWriteStream(outPath),
  );
};
