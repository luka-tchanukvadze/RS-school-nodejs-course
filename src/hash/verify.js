import { createReadStream } from "node:fs";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const verify = async () => {
  const checksumFile = resolve("checksums.json");

  try {
    await access(checksumFile);
  } catch {
    throw new Error("FS operation failed");
  }

  const checksums = JSON.parse(await readFile(checksumFile, "utf-8"));

  for (const [file, expected] of Object.entries(checksums)) {
    // calculatig sha256 using streams

    const actual = await new Promise((res, rej) => {
      const hash = createHash("sha256");
      const stream = createReadStream(file);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => res(hash.digest("hex")));
      stream.on("error", rej);
    });

    const status = actual === expected ? "OK" : "FAIL";
    console.log(`${file} - ${status}`);
  }
};

await verify();
