import { createWalletClient, custom, type WalletClient } from 'viem';
import { mainnet, baseSepolia } from 'viem/chains';
import type { WalletState } from '../types/wallet';
import { createPublicClient, http } from 'viem';

class WalletService {
  private client: WalletClient | null = null;
  private state: WalletState = {
    isConnected: false,
    isConnecting: false
  };

  async connect(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      this.state.isConnecting = true;
      
      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Create wallet client
      this.client = createWalletClient({
        chain: parseInt(chainId, 16) === 84532 ? baseSepolia : mainnet,
        transport: custom(window.ethereum),
        account: accounts[0] as `0x${string}`
      });

      this.state = {
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnecting: false
      };

      return this.state;
    } catch (error) {
      this.state = {
        isConnected: false,
        isConnecting: false,
        error: (error as Error).message
      };
      throw error;
    }
  }

  async switchToBase(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14A34' }], // Base Sepolia chain ID
      });
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14A34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          }],
        });
      } else {
        throw error;
      }
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  getClient(): WalletClient | null {
    return this.client;
  }

  disconnect(): void {
    this.client = null;
    this.state = {
      isConnected: false,
      isConnecting: false
    };
  }

  getPublicClient() {
    // Use the current chain if connected, otherwise default to baseSepolia
    const chain = this.state.chainId === 84532 ? baseSepolia : mainnet;
    const rpcUrl = chain === baseSepolia
      ? 'https://sepolia.base.org'
      : 'https://rpc.ankr.com/eth';
    return createPublicClient({ chain, transport: http(rpcUrl) });
  }

  isOnBaseSepolia(): boolean {
    return this.state.chainId === 84532;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper to create a wallet client with custom params
export function makeWalletClient({ account, chain, rpcUrl }: { account: string; chain: any; rpcUrl: string }) {
  return createWalletClient({
    account: account as `0x${string}`,
    chain,
    transport: http(rpcUrl)
  });
}

// Helper to create a public client with custom params
export function makePublicClient({ chain, rpcUrl }: { chain: any; rpcUrl: string }) {
  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
}

export default new WalletService();