import metaJson from "../data/abi-meta.json";
import adaptiveSupplyAbi from "../data/abi/AdaptiveSupply.json";
import exchangeHelperAbi from "../data/abi/ExchangeHelper.json";
import factoryAbi from "../data/abi/Factory.json";
import modelHelperAbi from "../data/abi/ModelHelper.json";
import resolverAbi from "../data/abi/Resolver.json";
import rewardsCalculatorAbi from "../data/abi/RewardsCalculator.json";

export type AbiItem = Readonly<Record<string, unknown>>;
export type Abi = ReadonlyArray<AbiItem>;

export type AbiContractStatus = {
  available: boolean;
  source?: string;
  artifact?: string;
  items?: number;
  sha256?: string;
  reason?: string;
};

export type AbiSourceMeta = {
  ref: string;
  fetchedAt: string;
  contracts: Record<string, AbiContractStatus>;
};

const ABIS: Record<string, Abi> = {
  AdaptiveSupply: adaptiveSupplyAbi as Abi,
  ExchangeHelper: exchangeHelperAbi as Abi,
  Factory: factoryAbi as Abi,
  ModelHelper: modelHelperAbi as Abi,
  Resolver: resolverAbi as Abi,
  RewardsCalculator: rewardsCalculatorAbi as Abi,
};

const meta = metaJson as AbiSourceMeta;

export const ABI_SOURCE_REF: string = meta.ref;
export const ABI_FETCHED_AT: string = meta.fetchedAt;

export function listAbis(): string[] {
  return Object.keys(ABIS).sort();
}

export function hasAbi(contract: string): boolean {
  return Object.prototype.hasOwnProperty.call(ABIS, contract);
}

export function getAbi(contract: string): Abi {
  const abi = ABIS[contract];
  if (!abi) {
    const status = meta.contracts[contract];
    if (status && !status.available) {
      throw new Error(
        `ABI for "${contract}" is not bundled at oikos-cash/core@${meta.ref.slice(0, 8)}: ${status.reason ?? "unavailable at this ref"}`,
      );
    }
    throw new Error(
      `Unknown contract "${contract}". Known contracts with ABIs: ${listAbis().join(", ")}.`,
    );
  }
  return abi.slice();
}

export function getAbiSourceMeta(): AbiSourceMeta {
  return {
    ref: meta.ref,
    fetchedAt: meta.fetchedAt,
    contracts: Object.fromEntries(
      Object.entries(meta.contracts).map(([k, v]) => [k, { ...v }]),
    ),
  };
}
