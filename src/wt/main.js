import { readFile } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const main = async () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const workerFile = join(dir, 'worker.js');

  const data = JSON.parse(await readFile('data.json', 'utf-8'));
  const coreCount = cpus().length;

  // split array into chunks, one per cpu core
  const size = Math.ceil(data.length / coreCount);
  const parts = [];
  for (let i = 0; i < data.length; i += size) {
    parts.push(data.slice(i, i + size));
  }

  // send each chunk to a worker and collect sorted results
  const sorted = await Promise.all(
    parts.map((chunk) => {
      return new Promise((res, rej) => {
        const w = new Worker(workerFile);
        w.postMessage(chunk);
        w.on('message', (result) => {
          res(result);
          w.terminate();
        });
        w.on('error', rej);
      });
    }),
  );

  // k-way merge all sorted chunks
  const merged = kWayMerge(sorted);
  console.log(merged);
};

const kWayMerge = (arrays) => {
  const ptrs = new Array(arrays.length).fill(0);
  const result = [];
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);

  for (let i = 0; i < total; i++) {
    let minVal = Infinity;
    let minIdx = -1;

    for (let j = 0; j < arrays.length; j++) {
      if (ptrs[j] < arrays[j].length && arrays[j][ptrs[j]] < minVal) {
        minVal = arrays[j][ptrs[j]];
        minIdx = j;
      }
    }

    result.push(minVal);
    ptrs[minIdx]++;
  }

  return result;
};

await main();
