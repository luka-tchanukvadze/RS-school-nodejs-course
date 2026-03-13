import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";

const restore = async () => {
  const snapFile = resolve("snapshot.json");
  const outDir = resolve("workspace_restored");

  try {
    await access(snapFile);
  } catch {
    throw new Error("FS operation failed");
  }

  // workspace_restored should not exist for now
  try {
    await access(outDir);
    throw new Error("FS operation failed");
  } catch (err) {
    if (err.message === "FS operation failed") throw err;
  }

  const snap = JSON.parse(await readFile(snapFile, "utf-8"));
  await mkdir(outDir, { recursive: true });

  // recreate all entries from snapshot
  for (const entry of snap.entries) {
    const target = join(outDir, entry.path);

    if (entry.type === "directory") {
      await mkdir(target, { recursive: true });
    } else if (entry.type === "file") {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(entry.content, "base64"));
    }
  }
};

await restore();
