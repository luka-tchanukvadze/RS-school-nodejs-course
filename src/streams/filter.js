import { Transform } from 'node:stream';

const filter = () => {
  const args = process.argv.slice(2);
  const pIdx = args.indexOf('--pattern');
  const pattern = pIdx !== -1 ? args[pIdx + 1] : '';

  let rest = '';

  const transform = new Transform({
    transform(chunk, enc, cb) {
      const text = rest + chunk.toString();
      const lines = text.split('\n');
      rest = lines.pop();

      for (const line of lines) {
        if (line.includes(pattern)) this.push(line + '\n');
      }
      cb();
    },
    flush(cb) {
      if (rest && rest.includes(pattern)) this.push(rest);
      cb();
    },
  });

  process.stdin.pipe(transform).pipe(process.stdout);
};

filter();
