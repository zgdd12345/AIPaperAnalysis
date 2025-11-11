import { readFile } from "node:fs/promises";
import { URL } from "node:url";

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".json")) {
    const file = new URL(url);
    const raw = await readFile(file, "utf8");
    const named = JSON.parse(raw);
    const safeKeys = Object.keys(named).filter((key) =>
      /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key),
    );

    const namedExports = safeKeys
      .map((key) => `export const ${key} = data.${key};`)
      .join("\n");

    return {
      format: "module",
      source: `const data = ${raw}; export default data; ${namedExports}`,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
