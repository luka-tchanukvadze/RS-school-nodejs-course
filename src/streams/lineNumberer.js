import { Transform } from 'node:stream';

const lineNumberer = () => {
  let nr = 1;
  let rest = '';

  const transform = new Transform({
    transform(chunk, enc, cb) {
      const text = rest + chunk.toString();
      const lines = text.split('\n');
      rest = lines.pop();

      for (const line of lines) {
        this.push(`${nr} | ${line}\n`);
        nr++;
      }
      cb();
    },
    flush(cb) {
      if (rest) this.push(`${nr} | ${rest}`);
      cb();
    },
  });

  process.stdin.pipe(transform).pipe(process.stdout);
};

lineNumberer();
