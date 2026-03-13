import { createBrotliDecompress } from "node:zlib";
import { createReadStream } from "node:fs";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";

const decompressDir = async () => {
  const compDir = resolve("workspace", "compressed");
  const archFile = join(compDir, "archive.br");
  const outDir = resolve("workspace", "decompressed");

  try {
    await access(compDir);
  } catch {
    throw new Error("FS operation failed");
  }

  try {
    await access(archFile);
  } catch {
    throw new Error("FS operation failed");
  }

  // decompresing the archive using streams
  const parts = [];
  const collector = new Writable({
    write(chunk, enc, cb) {
      parts.push(chunk);
      cb();
    },
  });

  await pipeline(
    createReadStream(archFile),
    createBrotliDecompress(),
    collector,
  );

  const fileMap = JSON.parse(Buffer.concat(parts).toString());
  await mkdir(outDir, { recursive: true });

  // recreating all files
  for (const [rel, b64] of Object.entries(fileMap)) {
    const target = join(outDir, rel);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(b64, "base64"));
  }
};

await decompressDir();
