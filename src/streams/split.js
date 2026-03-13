import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const split = async () => {
  const args = process.argv.slice(2);
  const lIdx = args.indexOf('--lines');
  const maxLines = lIdx !== -1 ? Number(args[lIdx + 1]) : 10;

  const srcPath = resolve('source.txt');

  // read file using readable stream
  const chunks = [];
  await new Promise((res, rej) => {
    const stream = createReadStream(srcPath);
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', res);
    stream.on('error', rej);
  });

  const content = Buffer.concat(chunks).toString();
  const lines = content.split('\n');

  // drop trailing empty string if file ends with newline
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  let chunkNr = 1;
  for (let i = 0; i < lines.length; i += maxLines) {
    const part = lines.slice(i, i + maxLines);
    await writeFile(`chunk_${chunkNr}.txt`, part.join('\n') + '\n');
    chunkNr++;
  }
};

await split();
