#!/usr/bin/env node
import {
  ABI_FETCHED_AT,
  ABI_SOURCE_REF,
  FETCHED_AT,
  getAbi,
  getAbiSourceMeta,
  getAddress,
  getAddresses,
  getSupportedNetworks,
  SOURCE_SHA256,
  SOURCE_TAG,
  SOURCE_URL,
} from "./index.js";

const HELP = `Usage: oikos-addresses <network> [contract]
       oikos-addresses --abi <Contract>

Print Oikos Protocol contract addresses (and optionally ABIs)
for a given network.

Arguments:
  network    Chain id (e.g. 56) or network name (e.g. bsc, bnb, binance)
  contract   Optional contract name (e.g. Vault). If omitted, prints all.

Examples:
  oikos-addresses 56
  oikos-addresses bsc
  oikos-addresses bsc Vault
  oikos-addresses --abi Resolver
  oikos-addresses --list
  oikos-addresses --json bsc

Options:
  -h, --help          Show this help
  -l, --list          List supported networks and ABI availability
  -j, --json          Output a single-line JSON (default is pretty-printed JSON)
  -a, --abi <name>    Print the bundled ABI for <name> as JSON
`;

function printNetworks(): void {
  const rows = getSupportedNetworks().map((n) => ({
    chainId: n.chainId,
    name: n.name,
    aliases: n.aliases.join(", "),
  }));
  console.log(`Addresses: oikos-cash/core @ ${SOURCE_TAG}`);
  console.log(`           ${SOURCE_URL}`);
  console.log(`           sha256=${SOURCE_SHA256.slice(0, 12)}…  fetchedAt=${FETCHED_AT}`);
  console.log("");
  console.log(`ABIs:      oikos-cash/core @ ${ABI_SOURCE_REF.slice(0, 12)}…  fetchedAt=${ABI_FETCHED_AT}`);
  console.log("");
  console.log("Supported networks:");
  for (const r of rows) {
    console.log(`  ${r.chainId}\t${r.name}\t[${r.aliases}]`);
  }
  console.log("");
  console.log("Contracts (ABI bundled?):");
  const abiMeta = getAbiSourceMeta();
  const names = Object.keys(abiMeta.contracts).sort();
  for (const name of names) {
    const status = abiMeta.contracts[name];
    if (status && status.available) {
      console.log(`  ${name.padEnd(20)} ✓  ${status.items} items`);
    } else {
      const reason = status?.reason ?? "unavailable";
      console.log(`  ${name.padEnd(20)} ✗  ${reason}`);
    }
  }
}

function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.includes("-l") || args.includes("--list")) {
    printNetworks();
    return 0;
  }

  const compact = args.includes("-j") || args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("-"));

  const abiFlagIdx = args.findIndex((a) => a === "-a" || a === "--abi");
  if (abiFlagIdx >= 0) {
    const next = args[abiFlagIdx + 1];
    const abiContract =
      next && !next.startsWith("-") ? next : positional[0];
    if (!abiContract) {
      process.stderr.write("Error: --abi requires a contract name\n");
      return 1;
    }
    try {
      const abi = getAbi(abiContract);
      console.log(
        compact ? JSON.stringify(abi) : JSON.stringify(abi, null, 2),
      );
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error: ${msg}\n`);
      return 1;
    }
  }

  const [network, contract] = positional;

  if (!network) {
    process.stderr.write("Error: missing <network>\n\n");
    process.stdout.write(HELP);
    return 1;
  }

  try {
    if (contract) {
      console.log(getAddress(network, contract));
    } else {
      const addrs = getAddresses(network);
      console.log(
        compact ? JSON.stringify(addrs) : JSON.stringify(addrs, null, 2),
      );
    }
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${msg}\n`);
    return 1;
  }
}

process.exit(main(process.argv));
