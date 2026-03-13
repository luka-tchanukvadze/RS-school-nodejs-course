import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";

const merge = async () => {
  const partsDir = resolve("workspace", "parts");
  const outFile = resolve("workspace", "merged.txt");

  const args = process.argv.slice(2);
  const filesIdx = args.indexOf("--files");
  const fileList =
    filesIdx !== -1 && args[filesIdx + 1]
      ? args[filesIdx + 1].split(",")
      : null;

  try {
    await access(partsDir);
  } catch {
    throw new Error("FS operation failed");
  }

  let files;

  if (fileList) {
    // checking if each requested file actually exists
    for (const f of fileList) {
      try {
        await access(join(partsDir, f));
      } catch {
        throw new Error("FS operation failed");
      }
    }
    files = fileList;
  } else {
    const all = await readdir(partsDir);
    files = all.filter((f) => f.endsWith(".txt")).sort();
    if (files.length === 0) throw new Error("FS operation failed");
  }

  let result = "";
  for (const f of files) {
    result += await readFile(join(partsDir, f), "utf-8");
  }

  await writeFile(outFile, result);
};

await merge();
