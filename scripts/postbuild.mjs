/**
 * Copies the assets that `output: "standalone"` leaves outside the server
 * bundle. Replaces the previous shell `cp -r`, which only ran on POSIX.
 */
import { cp, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function copy(from, to) {
  const src = resolve(root, from);
  try {
    await access(src);
  } catch {
    console.log(`[postbuild] skip ${from} (missing)`);
    return;
  }
  await cp(src, resolve(root, to), { recursive: true, force: true });
  console.log(`[postbuild] ${from} -> ${to}`);
}

await copy(".next/static", ".next/standalone/.next/static");
await copy("public", ".next/standalone/public");
