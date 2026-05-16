# @oikos/core-addresses

Programmatic access to Oikos Protocol contract addresses by chain id or network name.

Deployment data is bundled from a pinned release tag of [`oikos-cash/core`](https://github.com/oikos-cash/core), so installing a fixed version of this package gives you a frozen, offline snapshot of the addresses for that protocol release.

## Install

```sh
npm install @oikos/core-addresses
# or
pnpm add @oikos/core-addresses
# or
yarn add @oikos/core-addresses
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
```

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
| `-l, --list` | List supported networks plus the bundled source tag and sha256. |
| `-j, --json` | Print compact single-line JSON instead of pretty-printed. |

Exit code is `1` on unknown network or unknown contract.

## Supported networks

| chainId | name | aliases |
| --- | --- | --- |
| 56 | `bsc` | `bnb`, `binance`, `bnbchain`, `bsc-mainnet`, `bnb-mainnet` |

Adding a new network: append an entry to [`src/networks.ts`](src/networks.ts) and make sure the chain id is present in the source `deployment.json`.

## How the deployment data is pinned

This package does not check its address data into git. Instead, on every build it fetches the canonical `deployment.json` from a pinned ref of `oikos-cash/core`:

```
https://raw.githubusercontent.com/oikos-cash/core/${oikosCoreTag}/deploy_helper/out/deployment.json
```

The fetched bytes (plus tag, URL, timestamp, and sha256) are bundled into `dist/` and re-exported from the library, so consumers can verify which protocol release they are running against.

- The pin lives in [`package.json`](package.json) under `"oikosCoreTag"` (default `v0.1`).
- It can be overridden ad-hoc via the `OIKOS_CORE_TAG` env var or a positional arg to the fetch script.
- Network access is required at **build/publish time only**. End consumers installing from npm get a fully bundled, offline-capable package.

### Bumping the pinned protocol release

1. Edit `oikosCoreTag` in `package.json` to the new tag (e.g. `v0.2`).
2. Bump the npm `version` in `package.json` to match.
3. `npm run build` — re-fetches from the new ref and re-bundles.
4. `npm publish --access public`.

Or as a one-off without changing the default:

```sh
OIKOS_CORE_TAG=v0.2 npm run build
```

## Development

```sh
npm install
npm run fetch-deployment   # writes data/deployment.json + data/meta.json
npm run build              # tsup → dist/{index,cli}.{js,cjs,d.ts,d.cts}
npm test                   # node:test against the built bundle
npm run typecheck          # tsc --noEmit
```

`npm install` runs `prepare`, which runs the fetch + build pipeline automatically, so a fresh clone is ready to use immediately (network is required on first install in order to fetch the pinned deployment data).

## License

MIT.
