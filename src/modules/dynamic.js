import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dynamic = async () => {
  const name = process.argv[2];

  if (!name) {
    console.log("plugin not found");
    process.exit(1);
  }

  const dir = dirname(fileURLToPath(import.meta.url));
  const pluginFile = join(dir, "plugins", `${name}.js`);

  try {
    const mod = await import(pathToFileURL(pluginFile));
    console.log(mod.run());
  } catch {
    console.log("Plugin not found");
    process.exit(1);
  }
};

await dynamic();
