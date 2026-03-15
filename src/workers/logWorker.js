import { parentPort } from 'worker_threads';
import { createReadStream } from 'node:fs';

parentPort.on('message', ({ filePath, start, end }) => {
  const stats = { total: 0, levels: {}, status: {}, paths: {}, rtSum: 0 };
  let rest = '';

  const stream = createReadStream(filePath, { start, end });

  stream.on('data', (chunk) => {
    const text = rest + chunk.toString();
    const lines = text.split('\n');
    rest = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      parseLine(line, stats);
    }
  });

  stream.on('end', () => {
    if (rest && rest.trim()) parseLine(rest, stats);
    parentPort.postMessage(stats);
  });
});

const parseLine = (line, stats) => {
  const p = line.split(' ');
  if (p.length < 7) return;

  // format: timestamp level service statusCode responseTime method path
  const level = p[1];
  const code = p[3];
  const rt = parseFloat(p[4]);
  const path = p[6];

  stats.total++;
  stats.levels[level] = (stats.levels[level] || 0) + 1;
  stats.status[code[0] + 'xx'] = (stats.status[code[0] + 'xx'] || 0) + 1;
  stats.paths[path] = (stats.paths[path] || 0) + 1;
  stats.rtSum += rt;
};
