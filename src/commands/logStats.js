import { stat, open, writeFile, access } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePath } from '../utils/pathResolver.js';

const __dir = dirname(fileURLToPath(import.meta.url));

export const logStats = async (cwd, args) => {
  const inPath = resolvePath(cwd, args.input);
  const outPath = resolvePath(cwd, args.output);

  await access(inPath);
  const { size } = await stat(inPath);
  const coreCount = cpus().length;

  // figure out chunk boundaries on line breaks
  const splits = [0];
  const chunkSize = Math.ceil(size / coreCount);
  const fd = await open(inPath, 'r');

  for (let i = 1; i < coreCount; i++) {
    const pos = i * chunkSize;
    if (pos >= size) break;

    const buf = Buffer.alloc(4096);
    const { bytesRead } = await fd.read(buf, 0, 4096, pos);
    const nl = buf.subarray(0, bytesRead).indexOf(10);
    if (nl !== -1) splits.push(pos + nl + 1);
  }

  await fd.close();

  // build ranges from split points
  const ranges = [];
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i];
    const end = i < splits.length - 1 ? splits[i + 1] - 1 : size - 1;
    if (start <= end) ranges.push({ start, end });
  }

  // send each range to a worker
  const workerFile = join(__dir, '..', 'workers', 'logWorker.js');

  const results = await Promise.all(
    ranges.map(({ start, end }) => {
      return new Promise((res, rej) => {
        const w = new Worker(workerFile);
        w.postMessage({ filePath: inPath, start, end });
        w.on('message', (r) => { res(r); w.terminate(); });
        w.on('error', rej);
      });
    }),
  );

  // merge partial stats from all workers
  const merged = { total: 0, levels: {}, status: {}, paths: {}, rtSum: 0 };

  for (const r of results) {
    merged.total += r.total;
    merged.rtSum += r.rtSum;
    for (const [k, v] of Object.entries(r.levels))
      merged.levels[k] = (merged.levels[k] || 0) + v;
    for (const [k, v] of Object.entries(r.status))
      merged.status[k] = (merged.status[k] || 0) + v;
    for (const [k, v] of Object.entries(r.paths))
      merged.paths[k] = (merged.paths[k] || 0) + v;
  }

  const topPaths = Object.entries(merged.paths)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const output = {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs: Math.round((merged.rtSum / merged.total) * 100) / 100,
  };

  await writeFile(outPath, JSON.stringify(output, null, 2));
};
