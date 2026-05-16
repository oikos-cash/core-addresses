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

const ref =
  process.env.OIKOS_CORE_ABI_REF ||
  process.argv[2] ||
  pkg.oikosCoreAbiRef;

if (!ref) {
  console.error(
    "[fetch-abis] No ABI ref specified. Set OIKOS_CORE_ABI_REF, pass as arg, or set 'oikosCoreAbiRef' in package.json.",
  );
  process.exit(1);
}

const MANIFEST = [
  { key: "ExchangeHelper",    sourceFile: "ExchangeHelper.sol",    artifact: "ExchangeHelper" },
  { key: "ModelHelper",       sourceFile: "Helper.sol",            artifact: "ModelHelper" },
  { key: "AdaptiveSupply",    sourceFile: "AdaptiveSupply.sol",    artifact: "AdaptiveSupply" },
  { key: "RewardsCalculator", sourceFile: "RewardsCalculator.sol", artifact: "RewardsCalculator" },
  { key: "Resolver",          sourceFile: "Resolver.sol",          artifact: "Resolver" },
  { key: "Factory",           sourceFile: "OikosFactory.sol",      artifact: "OikosFactory" },
];

const UNAVAILABLE = [
  {
    key: "Vault",
    reason: "Diamond proxy; facet artifacts are not checked in at this pinned commit.",
  },
  {
    key: "Pool",
    reason: "External Uniswap V3 pool; ABI lives upstream in @uniswap/v3-core.",
  },
  {
    key: "Proxy",
    reason: "External OpenZeppelin ERC1967Proxy wrapping OKS; ABI lives upstream in @openzeppelin/contracts.",
  },
];

const abiOutDir = resolve(repoRoot, "data", "abi");
mkdirSync(abiOutDir, { recursive: true });

const contractsMeta = {};

console.log(`[fetch-abis] ref=${ref}`);

for (const entry of MANIFEST) {
  const url = `https://raw.githubusercontent.com/oikos-cash/core/${ref}/out/${entry.sourceFile}/${entry.artifact}.json`;
  console.log(`[fetch-abis] GET ${entry.key} ← ${url}`);

  const res = await fetch(url, {
    headers: { "User-Agent": `@oikos/core-addresses@${pkg.version}` },
  });

  if (!res.ok) {
    console.error(
      `[fetch-abis] HTTP ${res.status} ${res.statusText} for ${url}`,
    );
    if (res.status === 404) {
      console.error(
        `[fetch-abis] The ref '${ref}' or the artifact path may not exist on github.com/oikos-cash/core.`,
      );
      console.error(
        `[fetch-abis] Override with: OIKOS_CORE_ABI_REF=<ref> npm run fetch-abis`,
      );
    }
    process.exit(1);
  }

  const text = await res.text();
  let artifact;
  try {
    artifact = JSON.parse(text);
  } catch (err) {
    console.error(
      `[fetch-abis] Response for ${entry.key} is not valid JSON:`,
      err.message,
    );
    process.exit(1);
  }

  if (!artifact || !Array.isArray(artifact.abi) || artifact.abi.length === 0) {
    console.error(
      `[fetch-abis] ${entry.key}: artifact has no non-empty 'abi' array.`,
    );
    process.exit(1);
  }

  const abi = artifact.abi;
  const serialised = JSON.stringify(abi, null, 2) + "\n";
  const sha256 = createHash("sha256").update(serialised).digest("hex");

  writeFileSync(resolve(abiOutDir, `${entry.key}.json`), serialised);

  contractsMeta[entry.key] = {
    available: true,
    source: url,
    artifact: `out/${entry.sourceFile}/${entry.artifact}.json`,
    items: abi.length,
    sha256,
  };

  console.log(
    `[fetch-abis]   ${entry.key}: ${abi.length} items, sha256=${sha256.slice(0, 12)}…`,
  );
}

for (const u of UNAVAILABLE) {
  contractsMeta[u.key] = { available: false, reason: u.reason };
}

const meta = {
  ref,
  fetchedAt: new Date().toISOString(),
  contracts: contractsMeta,
};
writeFileSync(
  resolve(repoRoot, "data", "abi-meta.json"),
  JSON.stringify(meta, null, 2) + "\n",
);

const available = Object.values(contractsMeta).filter((c) => c.available).length;
const unavailable = Object.values(contractsMeta).filter((c) => !c.available).length;
console.log(
  `[fetch-abis] OK · available=${available} · unavailable=${unavailable} · wrote data/abi/*.json + data/abi-meta.json`,
);
