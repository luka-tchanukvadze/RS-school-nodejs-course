import { spawn } from 'node:child_process';

const execCommand = () => {
  const cmd = process.argv[2];

  if (!cmd) {
    console.error('no command provided');
    process.exit(1);
  }

  const child = spawn(cmd, {
    shell: true,
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('close', (code) => {
    process.exit(code);
  });
};

execCommand();
