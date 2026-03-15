import { createReadStream, createWriteStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export const jsonToCsv = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const outPath = resolvePath(cwd, args.output);

  await access(inPath);

  // need to buffer json to parse it (as per assignment hints)
  const chunks = [];
  await new Promise((res, rej) => {
    const stream = createReadStream(inPath);
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', res);
    stream.on('error', rej);
  });

  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new Error('invalid json');
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('invalid data');
  }

  const headers = Object.keys(data[0]);

  // write csv output through a stream
  const lines = [headers.join(',') + '\n'];
  for (const obj of data) {
    lines.push(headers.map((h) => String(obj[h] ?? '')).join(',') + '\n');
  }

  await pipeline(
    Readable.from(lines),
    createWriteStream(outPath),
  );
};
