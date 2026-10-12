/** Lists translation keys missing in any of NL/EN/FR/DE. Exits 1 when something is missing. */
import { readFileSync } from "node:fs";

const LOCALES = ["nl", "en", "fr", "de"] as const;
const dicts = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(`src/locales/${l}.json`, "utf8")) as Record<string, unknown>]),
);
const all = new Set(LOCALES.flatMap((l) => Object.keys(dicts[l])));
let missing = 0;
for (const l of LOCALES) {
  const gaps = [...all].filter((k) => !(k in dicts[l]) || dicts[l][k] === "");
  missing += gaps.length;
  console.log(`${l}: ${gaps.length} missing`);
  for (const k of gaps.slice(0, 50)) console.log(`  - ${k}`);
}
process.exit(missing ? 1 : 0);
