import { resolve } from 'node:path';

export const resolvePath = (cwd, p) => resolve(cwd, p);
