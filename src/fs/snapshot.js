import { readdir, stat, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve, relative } from "node:path";

const snapshot = async () => {
  const wsPath = resolve("workspace");

  try {
    await access(wsPath);
  } catch {
    throw new Error("FS operation failed");
  }

  const items = [];

  // go through all files and folders recursively
  const scan = async (dir) => {
    const dirItems = await readdir(dir, { withFileTypes: true });

    for (const entry of dirItems) {
      const full = join(dir, entry.name);
      const rel = relative(wsPath, full).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        items.push({ path: rel, type: "directory" });
        await scan(full);
      } else if (entry.isFile()) {
        const s = await stat(full);
        const raw = await readFile(full);
        items.push({
          path: rel,
          type: "file",
          size: s.size,
          content: raw.toString("base64"),
        });
      }
    }
  };

  await scan(wsPath);

  const snap = { rootPath: wsPath, entries: items };
  await writeFile("snapshot.json", JSON.stringify(snap, null, 2));
};

await snapshot();
