export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isConnecting: boolean;
  error?: string;
}

export type MintingState = {
  isMinting: boolean;
  success: boolean;
  error?: string;
  txHash?: string;
  statusMessage?: string;
  coinAddress?: string;
};

export interface NFTMetadata {
  name: string;
  ticker: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}
