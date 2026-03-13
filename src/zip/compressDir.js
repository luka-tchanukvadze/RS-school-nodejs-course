import { createBrotliCompress } from 'node:zlib';
import { createWriteStream } from 'node:fs';
import { readdir, readFile, mkdir, access } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const compressDir = async () => {
  const srcDir = resolve('workspace', 'toCompress');
  const outDir = resolve('workspace', 'compressed');

  try {
    await access(srcDir);
  } catch {
    throw new Error('FS operation failed');
  }

  const fileMap = {};

  // collect all files with their relative paths
  const scan = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(srcDir, full).replaceAll('\\', '/');
      if (entry.isDirectory()) {
        await scan(full);
      } else if (entry.isFile()) {
        const raw = await readFile(full);
        fileMap[rel] = raw.toString('base64');
      }
    }
  };

  await scan(srcDir);
  await mkdir(outDir, { recursive: true });

  // pack everything into json and brotli compress it
  const jsonStr = JSON.stringify(fileMap);
  await pipeline(
    Readable.from([jsonStr]),
    createBrotliCompress(),
    createWriteStream(join(outDir, 'archive.br')),
  );
};

await compressDir();
