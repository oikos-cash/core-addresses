import deploymentJson from "../data/deployment.json";
import metaJson from "../data/meta.json";
import { NETWORKS, type NetworkInfo } from "./networks.js";

export type KnownContractName =
  | "Vault"
  | "Pool"
  | "Proxy"
  | "ExchangeHelper"
  | "ModelHelper"
  | "AdaptiveSupply"
  | "RewardsCalculator"
  | "Resolver"
  | "Factory";

export type ContractName = KnownContractName | (string & {});

export type ContractAddresses = Record<string, string>;

export type Deployment = Record<string, ContractAddresses>;

export const deployment: Deployment = deploymentJson as Deployment;

export type SourceMeta = {
  tag: string;
  source: string;
  fetchedAt: string;
  sha256: string;
};

const meta = metaJson as SourceMeta;

export const SOURCE_TAG: string = meta.tag;
export const SOURCE_URL: string = meta.source;
export const FETCHED_AT: string = meta.fetchedAt;
export const SOURCE_SHA256: string = meta.sha256;

export function getSourceMeta(): SourceMeta {
  return { ...meta };
}

export { NETWORKS };
export type { NetworkInfo };

function resolveChainId(network: number | string): number {
  if (typeof network === "number") {
    if (!Number.isFinite(network) || !Number.isInteger(network)) {
      throw new Error(`Invalid chain id: ${network}`);
    }
    return network;
  }
  const s = String(network).toLowerCase().trim();
  if (s === "") throw new Error("Network identifier is empty");
  if (/^\d+$/.test(s)) return Number.parseInt(s, 10);
  const match = NETWORKS.find(
    (n) => n.name === s || n.aliases.includes(s),
  );
  if (!match) {
    const known = NETWORKS.map((n) => `${n.chainId} (${n.name})`).join(", ");
    throw new Error(`Unknown network: "${network}". Known: ${known}`);
  }
  return match.chainId;
}

export function getAddresses(network: number | string): ContractAddresses {
  const chainId = resolveChainId(network);
  const addrs = deployment[String(chainId)];
  if (!addrs) {
    throw new Error(`No deployment found for chain id ${chainId}`);
  }
  return { ...addrs };
}

export function getAddress(
  network: number | string,
  contract: ContractName,
): string {
  const addrs = getAddresses(network);
  const addr = addrs[contract];
  if (!addr) {
    throw new Error(
      `Contract "${contract}" not deployed on network ${network}`,
    );
  }
  return addr;
}

export function getSupportedNetworks(): NetworkInfo[] {
  return NETWORKS.filter(
    (n) => deployment[String(n.chainId)] !== undefined,
  ).map((n) => ({ ...n, aliases: [...n.aliases] }));
}

export function isSupported(network: number | string): boolean {
  try {
    const chainId = resolveChainId(network);
    return deployment[String(chainId)] !== undefined;
  } catch {
    return false;
  }
}

export function getNetworkInfo(
  network: number | string,
): NetworkInfo | undefined {
  try {
    const chainId = resolveChainId(network);
    const info = NETWORKS.find((n) => n.chainId === chainId);
    return info ? { ...info, aliases: [...info.aliases] } : undefined;
  } catch {
    return undefined;
  }
}
