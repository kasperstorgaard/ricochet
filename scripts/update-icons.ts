/**
 * Injects icon path data into components/icons.tsx between the generated markers.
 * Run with: deno task update-icons
 */

// Resolve assets dir from the package entry point (dist/index.mjs → assets/regular)
const entryUrl = import.meta.resolve("@phosphor-icons/core");
const packageDir = new URL("../", entryUrl).pathname;
const ASSETS_DIR = `${packageDir}assets/regular`;
const OUTPUT_FILE = "./components/icons.tsx";

const START_MARKER = "/** icons:start */";
const END_MARKER = "/** icons:end */";

// Reserved JS identifiers that need remapping
const NAME_MAP: Record<string, string> = {
  Infinity: "InfinitySymbol",
};

function toPascalCase(name: string): string {
  const pascal = name.split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  return NAME_MAP[pascal] ?? pascal;
}

function extractSvgContent(svg: string): string {
  return svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "").trim();
}

const icons: Array<[string, string]> = [];

for await (const entry of Deno.readDir(ASSETS_DIR)) {
  if (!entry.isFile || !entry.name.endsWith(".svg")) continue;

  const content = await Deno.readTextFile(`${ASSETS_DIR}/${entry.name}`);
  const pascalName = toPascalCase(entry.name.replace(".svg", ""));
  icons.push([pascalName, extractSvgContent(content)]);
}

icons.sort(([a], [b]) => a.localeCompare(b));

const iconExports = icons
  .map(([name, content]) => `export const ${name} = \`${content}\`;`)
  .join("\n");

const generated = `${START_MARKER}\n${iconExports}\n${END_MARKER}`;

const existing = await Deno.readTextFile(OUTPUT_FILE);
const startIdx = existing.indexOf(START_MARKER);
const endIdx = existing.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  throw new Error(`Markers not found in ${OUTPUT_FILE}`);
}

const updated = existing.slice(0, startIdx) + generated +
  existing.slice(endIdx + END_MARKER.length);

await Deno.writeTextFile(OUTPUT_FILE, updated);
console.log(`Injected ${icons.length} icons → ${OUTPUT_FILE}`);
