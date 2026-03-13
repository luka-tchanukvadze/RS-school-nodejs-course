const progress = () => {
  const args = process.argv.slice(2);

  const getArg = (name, def) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? Number(args[i + 1]) : def;
  };

  const duration = getArg('--duration', 5000);
  const interval = getArg('--interval', 100);
  const barLen = getArg('--length', 30);

  // parse color if provided
  let colStart = '';
  let colEnd = '';
  const colIdx = args.indexOf('--color');
  if (colIdx !== -1 && args[colIdx + 1]) {
    const m = args[colIdx + 1].match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
    if (m) {
      colStart = `\x1b[38;2;${parseInt(m[1], 16)};${parseInt(m[2], 16)};${parseInt(m[3], 16)}m`;
      colEnd = '\x1b[0m';
    }
  }

  const steps = Math.ceil(duration / interval);
  let curr = 0;

  const timer = setInterval(() => {
    curr++;
    const pct = Math.min(Math.round((curr / steps) * 100), 100);
    const filled = Math.round((pct / 100) * barLen);
    const empty = barLen - filled;

    const bar = `[${colStart}${'█'.repeat(filled)}${colEnd}${' '.repeat(empty)}]`;
    process.stdout.write(`\r${bar} ${pct}%`);

    if (curr >= steps) {
      clearInterval(timer);
      console.log('\nDone!');
    }
  }, interval);
};

progress();
