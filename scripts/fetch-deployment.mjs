#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const pkg = JSON.parse(
  readFileSync(resolve(repoRoot, "package.json"), "utf8"),
);

const tag =
  process.env.OIKOS_CORE_TAG ||
  process.argv[2] ||
  pkg.oikosCoreTag;

if (!tag) {
  console.error(
    "No tag specified. Set OIKOS_CORE_TAG, pass as arg, or set 'oikosCoreTag' in package.json.",
  );
  process.exit(1);
}

const url = `https://raw.githubusercontent.com/oikos-cash/core/${tag}/deploy_helper/out/deployment.json`;
console.log(`[fetch-deployment] tag=${tag}`);
console.log(`[fetch-deployment] GET ${url}`);

const res = await fetch(url, {
  headers: { "User-Agent": `@oikos/core-addresses@${pkg.version}` },
});

if (!res.ok) {
  console.error(
    `[fetch-deployment] HTTP ${res.status} ${res.statusText} for ${url}`,
  );
  if (res.status === 404) {
    console.error(
      `[fetch-deployment] The tag '${tag}' or the file path may not exist yet on github.com/oikos-cash/core.`,
    );
    console.error(
      `[fetch-deployment] Push the tag first, or override with: OIKOS_CORE_TAG=<ref> npm run fetch-deployment`,
    );
  }
  process.exit(1);
}

const text = await res.text();
let parsed;
try {
  parsed = JSON.parse(text);
} catch (err) {
  console.error("[fetch-deployment] Response is not valid JSON:", err.message);
  process.exit(1);
}

if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  console.error(
    "[fetch-deployment] Expected a JSON object mapping chainId -> { contract -> address }.",
  );
  process.exit(1);
}

const sha256 = createHash("sha256").update(text).digest("hex");
const fetchedAt = new Date().toISOString();
const meta = { tag, source: url, fetchedAt, sha256 };

const outDir = resolve(repoRoot, "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, "deployment.json"),
  JSON.stringify(parsed, null, 2) + "\n",
);
writeFileSync(
  resolve(outDir, "meta.json"),
  JSON.stringify(meta, null, 2) + "\n",
);

const chains = Object.keys(parsed).sort();
console.log(
  `[fetch-deployment] OK · chains=[${chains.join(", ")}] · sha256=${sha256.slice(0, 12)}…`,
);
console.log(`[fetch-deployment] wrote data/deployment.json + data/meta.json`);
