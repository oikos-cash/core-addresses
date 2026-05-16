export type NetworkInfo = {
  chainId: number;
  name: string;
  aliases: readonly string[];
};

export const NETWORKS: readonly NetworkInfo[] = [
  {
    chainId: 56,
    name: "bsc",
    aliases: ["bsc", "bnb", "binance", "bnbchain", "bsc-mainnet", "bnb-mainnet"],
  },
] as const;
