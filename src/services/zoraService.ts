import { createCoin, type ValidMetadataURI, DeployCurrency, setApiKey } from '@zoralabs/coins-sdk';
import type { MintingState } from '../types/wallet';
import walletService from './walletService';
import type { Address } from 'viem';

// Set up your API key before making any SDK requests
setApiKey(import.meta.env.VITE_ZORA_API_KEY);

class ZoraService {
  private mintingState: MintingState = {
    isMinting: false,
    success: false,
    statusMessage: ''
  };

  /**
   * Mint a new Zora coin (ERC20) using the Zora SDK and Viem clients.
   * Follows: https://docs.zora.co/coins/sdk/create-coin
   */
  async mintNFT(
    metadataIpfsUrl: string, // IPFS URL to metadata JSON
    bookTitle: string,
    bookSymbol: string,
  ): Promise<string> {
    try {
      this.mintingState.isMinting = true;
      this.mintingState.error = undefined;
      //this.mintingState.statusMessage = 'Uploading to IPFS...';

      // (Assume IPFS upload is done before calling this function)
      // If not, insert your IPFS upload logic here and update status accordingly.

      

      // Ensure wallet is connected and on Base
      const client = walletService.getClient();
      if (!client) throw new Error('Wallet not connected');
      await walletService.switchToBase();

      const address = walletService.getState().address;
      if (!address) throw new Error('No wallet address found');

      // Validate metadata URI before deploying
      ///this.mintingState.statusMessage = 'Validating metadata...';
      //await validateMetadataURIContent(metadataIpfsUrl as ValidMetadataURI);

      // Prepare coin parameters
      const coinParams = {
        name: bookTitle,
        symbol: bookSymbol,
        uri: metadataIpfsUrl as ValidMetadataURI,
        payoutRecipient: address as Address,
        chainId: 84532, // Base Sepolia testnet chain ID
        currency: DeployCurrency.ETH
      };

      // Set up public client for Base
      const publicClient = walletService.getPublicClient();
      this.mintingState.statusMessage = 'Waiting for MetaMask...';
      //this.mintingState.statusMessage = 'Minting...';
      // Create the coin (deploy contract)
      const txResult = await createCoin(coinParams, client, publicClient, {
        gasMultiplier: 120 // Add 20% buffer to gas (optional, per docs)
      });

      this.mintingState = {
        isMinting: false,
        txHash: txResult.hash,
        success: true,
        statusMessage: 'Success!',
        coinAddress: txResult.address
      };

      // Log deployment details for debugging
      console.log('Transaction hash:', txResult.hash);
      console.log('Coin address:', txResult.address);
      console.log('Deployment details:', txResult.deployment);

      return txResult.hash;
    } catch (error: any) {
      // Handle user rejection gracefully
      if (error && (error.code === 4001 || error.message?.includes('User rejected'))) {
        this.mintingState = {
          isMinting: false,
          success: false,
          statusMessage: 'Transaction was cancelled by the user.'
        };
        return '';
      }
      this.mintingState = {
        isMinting: false,
        error: (error as Error).message,
        success: false,
        statusMessage: 'Error: ' + (error as Error).message
      };
      console.error('Error creating coin:', error);
      throw error;
    }
  }

  getMintingState(): MintingState {
    return { ...this.mintingState };
  }

  resetMintingState(): void {
    this.mintingState = {
      isMinting: false,
      success: false,
      statusMessage: ''
    };
  }
}

export default new ZoraService();