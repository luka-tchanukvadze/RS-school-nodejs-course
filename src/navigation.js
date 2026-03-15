import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

export const goUp = (cwd) => {
  return resolve(cwd, '..');
};

export const changeDir = async (cwd, target) => {
  const full = resolve(cwd, target);
  const s = await stat(full);
  if (!s.isDirectory()) throw new Error('not a directory');
  return full;
};

export const listDir = async (cwd) => {
  const entries = await readdir(cwd, { withFileTypes: true });
  const dirs = [];
  const files = [];

  for (const e of entries) {
    if (e.isDirectory()) dirs.push(e.name);
    else files.push(e.name);
  }

  dirs.sort();
  files.sort();

  const all = [...dirs, ...files];
  if (all.length === 0) return '';

  const pad = Math.max(...all.map((n) => n.length)) + 2;
  const lines = [];
  for (const d of dirs) lines.push(`${d.padEnd(pad)}[folder]`);
  for (const f of files) lines.push(`${f.padEnd(pad)}[file]`);
  return lines.join('\n');
};
