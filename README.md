# @oikos/core-addresses

[![npm version](https://img.shields.io/npm/v/@oikos/core-addresses.svg)](https://www.npmjs.com/package/@oikos/core-addresses)
[![npm downloads](https://img.shields.io/npm/dm/@oikos/core-addresses.svg)](https://www.npmjs.com/package/@oikos/core-addresses)
[![license](https://img.shields.io/npm/l/@oikos/core-addresses.svg)](#license)

Programmatic access to Oikos Protocol contract addresses by chain id or network name.

Deployment data is bundled from a pinned release tag of [`oikos-cash/core`](https://github.com/oikos-cash/core), so installing a fixed version of this package gives you a frozen, offline snapshot of the addresses for that protocol release.

Published on npm: <https://www.npmjs.com/package/@oikos/core-addresses>

## Install

Requires **Node.js 18+** (uses native `fetch` at build time; the runtime library itself has zero dependencies).

```sh
npm install @oikos/core-addresses
# or
pnpm add @oikos/core-addresses
# or
yarn add @oikos/core-addresses
# or
bun add @oikos/core-addresses
```

To pin to a specific protocol release:

```sh
npm install @oikos/core-addresses@0.1.0
```

No install needed for one-off CLI lookups:

```sh
npx @oikos/core-addresses bsc Vault
```

## Programmatic usage

```ts
import {
  getAddress,
  getAddresses,
  getSupportedNetworks,
  isSupported,
  SOURCE_TAG,
} from "@oikos/core-addresses";

// By chain id
const vault = getAddress(56, "Vault");

// By name or alias (case-insensitive: bsc, bnb, binance, bnbchain, ...)
const pool = getAddress("bsc", "Pool");

// Full address map for a network
const addrs = getAddresses("bnb");
// {
//   Vault: "0x...",
//   Pool:  "0x...",
//   ...
// }

isSupported(56);      // true
isSupported(1);       // false
SOURCE_TAG;           // "v0.1"  — pinned protocol release
getSupportedNetworks();
```

CommonJS also works:

```js
const { getAddress } = require("@oikos/core-addresses");
```

### API

| Export | Description |
| --- | --- |
| `getAddresses(network)` | Returns a copy of the full `{ contract: address }` map for the network. Throws if unknown. |
| `getAddress(network, contract)` | Returns a single address. Throws if the network or contract is unknown. |
| `isSupported(network)` | `true` if the network has a bundled deployment. |
| `getSupportedNetworks()` | List of `{ chainId, name, aliases }` for networks with deployments. |
| `getNetworkInfo(network)` | Resolves any identifier to its `NetworkInfo`, or `undefined`. |
| `deployment` | Raw `{ chainId: { contract: address } }` map. |
| `NETWORKS` | All known network metadata (including networks without deployments yet). |
| `getSourceMeta()` | `{ tag, source, fetchedAt, sha256 }` for the bundled snapshot. |
| `SOURCE_TAG` / `SOURCE_URL` / `FETCHED_AT` / `SOURCE_SHA256` | Same values as above, as top-level constants. |
| `getContract(network, contract)` | Returns `{ address, abi }` for the network/contract pair. Throws if the ABI is not bundled (see [ABIs](#abis)). |
| `getAbi(contract)` | Returns the bundled ABI array for `contract`. Throws if not available. |
| `hasAbi(contract)` | `true` if an ABI is bundled for `contract`. |
| `listAbis()` | Sorted list of contracts with bundled ABIs. |
| `getAbiSourceMeta()` | `{ ref, fetchedAt, contracts }` describing the ABI pin and per-contract status. |
| `ABI_SOURCE_REF` / `ABI_FETCHED_AT` | Top-level constants for the ABI pin. |

`network` can be a number (`56`), a numeric string (`"56"`), the canonical name (`"bsc"`), or any registered alias (`"bnb"`, `"binance"`, `"bnbchain"`, `"bsc-mainnet"`, `"bnb-mainnet"`). Names are case-insensitive.

### Types

```ts
type NetworkInfo = {
  chainId: number;
  name: string;
  aliases: readonly string[];
};

type ContractAddresses = Record<string, string>;
type Deployment = Record<string, ContractAddresses>;

type SourceMeta = {
  tag: string;        // e.g. "v0.1"
  source: string;     // raw.githubusercontent URL the data was fetched from
  fetchedAt: string;  // ISO-8601 timestamp
  sha256: string;     // sha256 of the fetched bytes
};

type AbiItem = Readonly<Record<string, unknown>>;
type Abi = ReadonlyArray<AbiItem>;

type AbiContractStatus = {
  available: boolean;
  source?: string;     // raw.githubusercontent URL of the source artifact
  artifact?: string;   // out/<file>.sol/<name>.json
  items?: number;      // number of ABI entries
  sha256?: string;     // sha256 of the extracted, serialised ABI
  reason?: string;     // populated when available === false
};

type AbiSourceMeta = {
  ref: string;         // commit / tag the ABIs are pinned to
  fetchedAt: string;
  contracts: Record<string, AbiContractStatus>;
};
```

## ABIs

ABIs for the deployed contracts are bundled alongside the addresses, fetched at build time from a **separate** pin on `oikos-cash/core` (see `oikosCoreAbiRef` in [`package.json`](package.json)). The ABI pin is decoupled from the deployment pin (`oikosCoreTag`) so that on-chain addresses and the ABIs used to call them can move on independent cadences.

```ts
import { getContract, getAbi, hasAbi, listAbis } from "@oikos/core-addresses";

const { address, abi } = getContract("bsc", "Resolver");
//   ^ 0xa78142B2A829AbA5D737af86a14d2BeEE82dDcF9
//             ^ readonly array of ABI items

getAbi("ExchangeHelper"); // → readonly ABI array (copy)
hasAbi("Vault");          // → false at the current ABI pin (see below)
listAbis();               // → ["AdaptiveSupply", "ExchangeHelper", "Factory",
                          //    "ModelHelper", "Resolver", "RewardsCalculator"]
```

The returned `abi` is typed as `ReadonlyArray<Readonly<Record<string, unknown>>>` — pass it directly to ethers `new Contract(address, abi, …)`, viem `getContract({ address, abi, … })`, or wagmi. If you want the wagmi/viem `as const` inference you'll need to cast or codegen on your side; this package intentionally avoids pulling in `abitype`.

### What's bundled at the current ABI pin

| Contract | ABI bundled? | Note |
| --- | --- | --- |
| `AdaptiveSupply` | ✅ | |
| `ExchangeHelper` | ✅ | |
| `Factory` | ✅ | Sourced from `OikosFactory.sol`. |
| `ModelHelper` | ✅ | Sourced from `Helper.sol`. |
| `Resolver` | ✅ | |
| `RewardsCalculator` | ✅ | |
| `Vault` | ❌ | Diamond proxy — composed ABI is a union of facets. Facet artifacts aren't checked in at the current ABI pin. |
| `Pool` | ❌ | External Uniswap V3 pool. Use [`@uniswap/v3-core`](https://www.npmjs.com/package/@uniswap/v3-core) `IUniswapV3Pool` for now. |
| `Proxy` | ❌ | External OpenZeppelin `ERC1967Proxy` wrapping OKS. Use [`@openzeppelin/contracts`](https://www.npmjs.com/package/@openzeppelin/contracts) for now. |

`getAbi()` / `getContract()` throw a clear, named error for the three unavailable contracts. Use `hasAbi(name)` to guard.

The current ABI pin is a temporary commit reference rather than a tagged release; it will be moved to a tag once the missing artifacts are available upstream.

## CLI (`npx`)

```sh
npx @oikos/core-addresses 56
npx @oikos/core-addresses bsc
npx @oikos/core-addresses bsc Vault
npx @oikos/core-addresses --list
npx @oikos/core-addresses --json bsc
```

| Flag | Effect |
| --- | --- |
| `-h, --help` | Show usage. |
| `-l, --list` | List supported networks, the bundled source tag/sha256, and per-contract ABI availability. |
| `-j, --json` | Print compact single-line JSON instead of pretty-printed. |
| `-a, --abi <name>` | Print the bundled ABI for `<name>` as JSON. |

```sh
npx @oikos/core-addresses --abi Resolver
npx @oikos/core-addresses -a ExchangeHelper -j
```

Exit code is `1` on unknown network, unknown contract, or when an ABI is requested for a contract that isn't bundled at the current ABI pin.

## Supported networks

| chainId | name | aliases |
| --- | --- | --- |
| 56 | `bsc` | `bnb`, `binance`, `bnbchain`, `bsc-mainnet`, `bnb-mainnet` |

Adding a new network: append an entry to [`src/networks.ts`](src/networks.ts) and make sure the chain id is present in the source `deployment.json`.

## How the data is pinned

This package does not check its address or ABI data into git. Instead, on every build it fetches both from `oikos-cash/core` at independent pinned refs.

**Addresses** — single file at:
```
https://raw.githubusercontent.com/oikos-cash/core/${oikosCoreTag}/deploy_helper/out/deployment.json
```

**ABIs** — one file per available contract at:
```
https://raw.githubusercontent.com/oikos-cash/core/${oikosCoreAbiRef}/out/<file>.sol/<artifact>.json
```
The `abi` field is extracted from each Foundry artifact; bytecode and metadata are dropped.

Both feeds (plus per-file sha256 and fetch timestamp) are bundled into `dist/` and re-exported from the library, so consumers can verify which upstream bytes they are running against.

- Address pin: [`package.json`](package.json) field `"oikosCoreTag"` (default `v0.1`). Override via `OIKOS_CORE_TAG`.
- ABI pin: [`package.json`](package.json) field `"oikosCoreAbiRef"` (default: a commit hash; currently temporary). Override via `OIKOS_CORE_ABI_REF`.
- Network access is required at **build/publish time only**. End consumers installing from npm get a fully bundled, offline-capable package.

### Bumping the pinned refs

1. Edit `oikosCoreTag` and/or `oikosCoreAbiRef` in `package.json`.
2. Bump the npm `version` in `package.json` accordingly.
3. `npm run build` — re-fetches from both refs and re-bundles.
4. `npm publish --access public`.

Or as a one-off without changing the defaults:

```sh
OIKOS_CORE_TAG=v0.2 npm run build
OIKOS_CORE_ABI_REF=<commit-or-tag> npm run build
```

## Development

```sh
npm install
npm run fetch              # both feeds: deployment.json + ABIs
npm run fetch-deployment   # addresses only → data/deployment.json + data/meta.json
npm run fetch-abis         # ABIs only → data/abi/*.json + data/abi-meta.json
npm run build              # tsup → dist/{index,cli}.{js,cjs,d.ts,d.cts}
npm test                   # node:test against the built bundle
npm run typecheck          # tsc --noEmit
```

`npm install` runs `prepare`, which runs the fetch + build pipeline automatically, so a fresh clone is ready to use immediately (network is required on first install in order to fetch the pinned deployment data).

## License

MIT.
