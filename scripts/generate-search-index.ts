import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSearchIndexEntries } from "../lib/search/collectSearchIndexEntries";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const outputPath = path.join(projectRoot, "public", "search-index.json");

/**
 * サイト内検索用 index JSON を生成する。
 */
async function main(): Promise<void> {
  const entries = collectSearchIndexEntries(path.join(projectRoot, "content"));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  console.log(`Wrote ${entries.length} entries to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
