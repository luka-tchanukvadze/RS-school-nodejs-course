import readline from 'node:readline';
import { goUp, changeDir, listDir } from './navigation.js';
import { parseArgs } from './utils/argParser.js';
import { csvToJson } from './commands/csvToJson.js';
import { jsonToCsv } from './commands/jsonToCsv.js';
import { count } from './commands/count.js';
import { hash } from './commands/hash.js';
import { hashCompare } from './commands/hashCompare.js';
import { encrypt } from './commands/encrypt.js';
import { decrypt } from './commands/decrypt.js';
import { logStats } from './commands/logStats.js';

const CMDS = {
  'csv-to-json': { need: ['input', 'output'], fn: csvToJson },
  'json-to-csv': { need: ['input', 'output'], fn: jsonToCsv },
  'count': { need: ['input'], fn: count },
  'hash': { need: ['input'], fn: hash },
  'hash-compare': { need: ['input', 'hash'], fn: hashCompare },
  'encrypt': { need: ['input', 'output', 'password'], fn: encrypt },
  'decrypt': { need: ['input', 'output', 'password'], fn: decrypt },
  'log-stats': { need: ['input', 'output'], fn: logStats },
};

export const startRepl = async (initCwd) => {
  let cwd = initCwd;
  let closed = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => { if (!closed) try { rl.prompt(); } catch {} };

  rl.setPrompt('> ');
  rl.prompt();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) { prompt(); continue; }
    if (trimmed === '.exit') break;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const rest = parts.slice(1);
    const args = parseArgs(rest);

    let ok = true;

    try {
      // navigation
      if (cmd === 'up') {
        cwd = goUp(cwd);
      } else if (cmd === 'cd') {
        if (!rest[0]) { ok = false; console.log('Invalid input'); }
        else cwd = await changeDir(cwd, rest[0]);
      } else if (cmd === 'ls') {
        const out = await listDir(cwd);
        if (out) console.log(out);

      // data processing
      } else if (CMDS[cmd]) {
        const spec = CMDS[cmd];
        let missing = false;
        for (const key of spec.need) {
          if (!args[key]) { missing = true; break; }
        }
        if (missing) { ok = false; console.log('Invalid input'); }
        else await spec.fn(cwd, args);
      } else {
        ok = false;
        console.log('Invalid input');
      }

      if (ok) console.log(`You are currently in ${cwd}`);
    } catch {
      console.log('Operation failed');
    }

    prompt();
  }

  closed = true;
  console.log('Thank you for using Data Processing CLI!');
  process.exit(0);
};
