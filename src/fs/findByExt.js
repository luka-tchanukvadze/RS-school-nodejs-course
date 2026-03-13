import { readdir, access } from "node:fs/promises";
import { join, resolve, relative, extname } from "node:path";

const findByExt = async () => {
  const wsPath = resolve("workspace");

  try {
    await access(wsPath);
  } catch {
    throw new Error("FS operation failed");
  }

  const args = process.argv.slice(2);
  const extIdx = args.indexOf("--ext");
  let ext = extIdx !== -1 && args[extIdx + 1] ? args[extIdx + 1] : "txt";
  if (!ext.startsWith(".")) ext = "." + ext;

  const found = [];

  const scan = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(full);
      } else if (entry.isFile() && extname(entry.name) === ext) {
        found.push(relative(wsPath, full).replaceAll("\\", "/"));
      }
    }
  };
  await scan(wsPath);
  found.sort();
  found.forEach((f) => console.log(f));
};

await findByExt();
