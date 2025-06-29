<template>
  <div class="image-viewer">
    <div class="image-style-select">
      <label for="art-style">Art Style: </label>
      <select id="art-style" :value="props.selectedArtStyle" @change="handleArtStyleChange">
        <option v-for="style in ArtStyles" :key="style" :value="style">{{ style }}</option>
      </select>
    </div>
    <div class="image-container">
      <div v-if="props.isGenerating" class="loading-state">
        <div class="ai-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h4>Generating AI Illustration...</h4>
        <p>{{ loadingMessage }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
      <div v-else-if="props.imageUrl && props.imageUrl.length > 0" class="image-display">
        <div class="image-hover-container">
          <img :src="props.imageUrl" alt="AI Generated Illustration" />
          <div class="image-hover-buttons">
            <button @click="downloadImage" :disabled="!props.imageUrl" class="action-btn" title="Download image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <button @click="openMintModal" :disabled="!props.imageUrl" class="mint-btn" title="Mint as NFT">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="10,6 10,12 16,12"/>
              </svg>
              Mint
            </button>
          </div>
        </div>
        <div class="image-info">
          <div class="summary-section">
            <h4></h4>
            <p></p>
          </div>
        </div>
      </div>
      <div v-else-if="props.wasCanceled" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <h4>Illustration canceled</h4>
        <p>You canceled the previous generation. Turn the page or select text to generate a new illustration.</p>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <h4>No illustration yet</h4>
        <p>Turn the page or select text to generate an AI illustration</p>
      </div>
    </div>
  </div>
  <!-- Move modal outside .image-viewer and reading container for true window centering -->
  <Teleport to="body">
    <div v-if="showMintModal" class="mint-modal" @click.self="closeMintModal">
      <div class="mint-modal-content">
        <div class="mint-modal-header">
          <h3>Mint as Zora Coin</h3>
          <button class="close-x-btn" @click="closeMintModal" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="mint-modal-body">
      <div v-if="!walletState.isConnected" class="wallet-connect">
        <button 
          @click="connectWallet" 
          :disabled="walletState.isConnecting"
          class="connect-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          {{ walletState.isConnecting ? 'Connecting...' : 'Connect Wallet' }}
        </button>
      </div>
          <div v-else>
            <div v-if="walletState.chainId !== 84532 && walletState.chainId !== 8453" class="network-warning">
              <span class="network-warning-icon">
                <img src="/metamask-fox-dev.svg" alt="MetaMask" style="height: 18px; vertical-align: middle; margin-right: 4px; margin-left: 4px;" />
              </span>
              <span>
                Please switch your wallet to <b>Base Mainnet</b> or <b>Base Sepolia</b> to mint.
              </span>
            </div>
            <form v-if="walletState.chainId === 84532 || walletState.chainId === 8453" @submit.prevent="mintNFT" class="mint-form">
              <div class="form-group">
                <label>Name <span class="required">*</span></label>
                <input v-model="coinName" required placeholder="Zora Coin Name" />
              </div>
              <div class="form-group">
                <label>Symbol</label>
                <input v-model="coinSymbol" maxlength="8" placeholder="Symbol (optional)" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="coinDescription" rows="3" placeholder="Description (optional)" />
              </div>
              <button 
                type="submit"
                class="mint-btn main-mint-btn"
                :disabled="isUploading || mintingState.isMinting || !coinName || mintingState.statusMessage === 'Waiting for MetaMask...'"
              >
                <span v-if="isUploading">Uploading to IPFS...</span>
                <span v-else-if="mintingState.statusMessage && mintingState.statusMessage !== 'Transaction was cancelled by the user.' && !mintingState.txHash">{{ mintingState.statusMessage }}</span>
                <span v-else>Mint</span>
              </button>
            </form>
            <div v-if="(walletState.chainId === 84532 || walletState.chainId === 8453) && mintingState.txHash" class="mint-success">
              <div class="mint-success-content">
                <div v-if="mintingState.coinAddress" class="zora-btn-center-wrap">
                  <a
                    :href="`https://testnet.zora.co/coin/bsep:${mintingState.coinAddress}`"
                    target="_blank"
                    rel="noopener"
                    class="zora-view-btn user-friendly-zora-btn"
                    aria-label="View your coin on Zora"
                  >
                    <img src="https://zora.co/favicon.ico" alt="Zora" style="height: 26px; margin-right: 10px; vertical-align: middle;" />
                    <span>View Your Coin on Zora</span>
                  </a>
                  <div class="zora-success-desc">You can now view, share, or trade your new Zora Coin on the Zora platform.</div>
                </div>
              </div>
            </div>
            <div v-if="(walletState.chainId === 84532 || walletState.chainId === 8453) && mintingState.error" class="mint-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ mintingState.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { WalletState, MintingState } from '../types/wallet';
import walletService from '../services/walletService';
import zoraService from '../services/zoraService';

interface Props {
  imageUrl?: string;
  summary?: string;
  isGenerating?: boolean;
  selectedText?: string;
  bookTitle?: string;
  selectedArtStyle?: string;
  wasCanceled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: '',
  summary: '',
  isGenerating: false,
  selectedText: '',
  bookTitle: 'Unknown Book',
  selectedArtStyle: 'Futuristic',
  wasCanceled: false
});

const emit = defineEmits<{
  regenerate: [style: string];
  download: [url: string];
}>();

const walletState = ref<WalletState>(walletService.getState());
const mintingState = ref<MintingState>(zoraService.getMintingState());
const loadingMessage = ref('Analyzing text content...');
const progress = ref(0);
const showMintModal = ref(false);

// Coin form state
const coinName = ref('');
const coinSymbol = ref('AIBOOK');
const coinDescription = ref('');
const isUploading = ref(false);

// Art style state
const ArtStyles = [
  'Cyberpunk',
  'Fantasy',
  'Futuristic',
  'Abstract',
  'Retro Wave',
  'Sci-Fi'
] as const;

// Helper to convert data URL to Blob
function dataURLtoBlob(dataurl: string) {
  if (!dataurl || !dataurl.includes(',')) {
    throw new Error('Invalid image data URL');
  }
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !arr[1]) {
    throw new Error('Invalid image data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  if (!(blob instanceof Blob)) {
    throw new Error('Failed to convert image data URL to Blob');
  }
  return blob;
}

// Helper to convert a remote URL to Blob
async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return await res.blob();
}

// Watch for selectedText to prefill description
watch(() => props.selectedText, (val) => {
  if (val) coinDescription.value = val;
});

const openMintModal = () => {
  coinName.value = props.bookTitle || 'AI Book Coin';
  coinSymbol.value = 'AIBOOK';
  coinDescription.value = props.summary || '';
  // Fully reset minting state so previous success does not persist
  zoraService.resetMintingState();
  mintingState.value = zoraService.getMintingState();
  showMintModal.value = true;
};

const connectWallet = async () => {
  try {
    await walletService.connect();
    walletState.value = walletService.getState();
  } catch (error) {
    console.error('Wallet connection failed:', error);
  }
};

const mintNFT = async () => {
  if (!props.imageUrl || !coinName.value || !coinSymbol.value) return;
  try {
    isUploading.value = true;
    mintingState.value.statusMessage = 'Uploading to IPFS...';
    // Convert image to Blob (handle both data URLs and remote URLs)
    let imageBlob;
    if (props.imageUrl.startsWith('data:image/')) {
      imageBlob = dataURLtoBlob(props.imageUrl);
    } else {
      imageBlob = await urlToBlob(props.imageUrl);
    }
    if (!(imageBlob instanceof Blob)) {
      throw new Error('Image conversion failed: not a Blob');
    }
    const formData = new FormData();
    formData.append('file', imageBlob, 'ai-image.png');
    formData.append('metadata', JSON.stringify({
      name: coinName.value,
      ticker: coinSymbol.value,
      description: coinDescription.value
    }));
    // Upload to Pinata
    const res = await fetch('/api/pinata-upload', {
      method: 'POST',
      body: formData
    });
    let metadataIpfsUrl;
    if (!res.ok) {
      let errorMsg = '';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || JSON.stringify(errJson);
      } catch (jsonErr) {
        errorMsg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
      }
      throw new Error(`Pinata upload failed: ${errorMsg}`);
    } else {
      try {
        const json = await res.json();
        metadataIpfsUrl = json.metadataIpfsUrl;
      } catch {
        throw new Error('Pinata upload succeeded but response was not valid JSON.');
      }
    }
    isUploading.value = false;
    mintingState.value.statusMessage = 'Waiting for MetaMask...';
    // Mint NFT/coin on Zora
    await zoraService.mintNFT(
      metadataIpfsUrl,
      coinName.value,
      coinSymbol.value
    );
    mintingState.value = zoraService.getMintingState();
  } catch (error) {
    isUploading.value = false;
    mintingState.value = zoraService.getMintingState();
    if (error instanceof Error) {
      mintingState.value.error = error.message;
    } else {
      mintingState.value.error = String(error);
    }
  }
};

const downloadImage = () => {
  if (props.imageUrl) {
    emit('download', props.imageUrl);
  }
};

const closeMintModal = () => {
  showMintModal.value = false;
  coinName.value = '';
  coinSymbol.value = 'AIBOOK';
  coinDescription.value = '';
  isUploading.value = false;
  mintingState.value = zoraService.getMintingState();
};

// Prevent background scroll when modal is open
watch(showMintModal, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

watch(
  () => [props.summary, showMintModal.value],
  ([summary, show]) => {
    if (show) {
      coinDescription.value = typeof summary === 'string' ? summary : '';
    }
  }
);

// Remove watcher on selectedArtStyle and add a handler for dropdown change
function handleArtStyleChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  if (val && val !== props.selectedArtStyle) {
    emit('regenerate', val);
  }
}

onMounted(() => {
  walletState.value = walletService.getState();
  mintingState.value = zoraService.getMintingState();
  // Listen for MetaMask account and chain changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', async () => {
      await walletService.connect();
      walletState.value = walletService.getState();
    });
    window.ethereum.on('chainChanged', async () => {
      await walletService.connect();
      walletState.value = walletService.getState();
    });
  }
  // Close modal on Escape key
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showMintModal.value) closeMintModal();
  };
  window.addEventListener('keydown', escHandler);
  onUnmounted(() => window.removeEventListener('keydown', escHandler));
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 28px 32px 24px 32px;
  box-sizing: border-box;
  overflow-x: auto;
}

.image-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8px;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: auto;
}

.loading-state {
  text-align: center;
  padding: 48px 24px;
}

.ai-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--color-primary);
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: var(--color-secondary);
  animation-delay: 0.3s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: var(--color-accent);
  animation-delay: 0.6s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.loading-state p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0 0 20px 0;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.image-display {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  width: 100%;
  max-width: 100%;
}

.image-hover-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.image-hover-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.55);
  border-radius: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1;
}

.image-hover-container:hover::before,
.image-hover-container:focus-within::before {
  opacity: 0.22;
  background: rgba(0,0,0,0.72);
}

.image-hover-buttons {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.18s;
  width: auto;
  background: none;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  align-items: center;
  z-index: 10;
}

.image-hover-container:hover .image-hover-buttons,
.image-hover-container:focus-within .image-hover-buttons {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1.04);
}

.image-hover-container img {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
  object-fit: contain;
  z-index: 0;
}

.image-hover-buttons .action-btn,
.image-hover-buttons .mint-btn {
  font-size: 1rem;
  padding: 12px 0;
  border-radius: 8px;
  background: #fff;
  color: #007AFF;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  cursor: pointer;
  width: 160px;
  min-width: 160px;
  min-height: 48px;
  opacity: 0.7;
}
.image-hover-buttons .action-btn:hover,
.image-hover-buttons .mint-btn:hover,
.image-hover-buttons .action-btn:focus,
.image-hover-buttons .mint-btn:focus {
  background: #e6eeff;
  color: #0056CC;
  box-shadow: 0 4px 16px rgba(0,122,255,0.10);
  transform: translateY(-2px) scale(1.05);
  opacity: 1;
}
.image-hover-buttons .action-btn:active,
.image-hover-buttons .mint-btn:active {
  background: #dbeafe;
  color: #003e99;
  transform: scale(0.97);
}
.image-hover-buttons .action-btn:disabled,
.image-hover-buttons .mint-btn:disabled {
  color: #C7C7CC;
  cursor: not-allowed;
  background: #f0f0f0;
  box-shadow: none;
}

.image-info {
  margin-top: 20px;
}

.summary-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.summary-section p {
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: #C7C7CC;
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #86868B;
}

.empty-state p {
  font-size: 14px;
  color: #C7C7CC;
  margin: 0;
  line-height: 1.4;
}

.nft-section {
  border-top: 1px solid #E5E5EA;
  padding: 24px;
  background: #FAFAFA;
}

.nft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nft-header h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1D1D1F;
}

.wallet-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #86868B;
}

.connection-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FF3B30;
}

.connection-indicator.connected {
  background: #34C759;
}

.connect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.connect-btn:hover:not(:disabled) {
  background: #0056CC;
  transform: translateY(-1px);
}

.connect-btn:disabled {
  background: #C7C7CC;
  cursor: not-allowed;
}

.mint-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mint-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #FF9500;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mint-btn:hover:not(:disabled) {
  background: #E6820E;
  transform: translateY(-1px);
}

.mint-btn:disabled {
  background: #C7C7CC;
  cursor: not-allowed;
}

.mint-success {
  padding: 10px 6px 8px 6px;
  margin-top: 8px;
  min-width: 0;
  max-width: 320px;
}
.mint-success-content {
  gap: 6px;
}
.zora-btn-center-wrap {
  min-height: 80px;
}
.zora-success-desc {
  margin-top: 6px;
  font-size: 0.98em;
  text-align: center;
}
.mint-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  border-radius: 8px;
  font-size: 12px;
}

.mint-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  min-height: 100vh;
  min-width: 100vw;
}
.mint-modal-content {
  background: rgb(239,226,204);
  border-radius: 18px;
  padding: 0 0 32px 0;
  min-width: 360px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0,0,0,0.22);
  animation: popin 0.25s cubic-bezier(.4,2,.6,1) 1;
  
}
.mint-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 12px 32px;
  border-bottom: 1px solid #E5E5EA;
}
.mint-modal-body {
  padding: 32px;
}
.close-x-btn {
  background: none;
  border: none;
  color: #86868B;
  cursor: pointer;
  border-radius: 50%;
  padding: 4px;
  transition: background 0.2s;
}
.close-x-btn:hover {
  background: #F2F2F7;
}
.mint-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-weight: 500;
  color: #1D1D1F;
  font-size: 14px;
}
.required {
  color: #FF3B30;
  font-size: 13px;
}
.mint-btn.main-mint-btn {
  margin-top: 12px;
  width: 100%;
  font-size: 16px;
  padding: 14px 0;
  background: linear-gradient(90deg, #FF9500 0%, #FF5E3A 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.08);
  transition: background 0.2s;
}
.mint-btn.main-mint-btn:disabled {
  background: #C7C7CC;
  color: #fff;
  cursor: not-allowed;
}
.success-btn {
  display: inline-block;
  padding: 14px 0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.08em;
  background: #f7faff;
  color: #2563eb;
  border: 1.5px solid #e0e7ef;
  text-decoration: none;
  transition: background 0.18s, box-shadow 0.18s, color 0.18s, border 0.18s, transform 0.13s;
  box-shadow: 0 2px 8px rgba(44, 204, 64, 0.04);
  margin: 0 2px;
  cursor: pointer;
  outline: none;
}
.success-btn:hover, .success-btn:focus {
  background: #e6f0ff;
  color: #174ea6;
  border: 1.5px solid #b6d4fe;
  box-shadow: 0 6px 18px rgba(44, 204, 64, 0.10);
  transform: translateY(-2px) scale(1.04);
}
.explorer-btn svg {
  stroke: #2563eb;
}
.zora-btn svg {
  stroke: #e535ab;
}
.network-warning {
  color: #ff4136;
  font-weight: 500;
  text-align: center;
  margin-bottom: 16px;
  background: #fff6f6;
  border: 1.5px solid #ff4136;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.05em;
}
.network-warning-icon {
  display: flex;
  align-items: center;
  margin-right: 6px;
}
.user-friendly-zora-btn {
  font-size: 1.22em !important;
  padding: 20px 0 !important;
  border-radius: 26px !important;
  background: linear-gradient(100deg, #2563eb 0%, #10b981 100%) !important;
  color: #fff !important;
  box-shadow: 0 8px 32px 0 rgba(37,99,235,0.13), 0 2px 12px 0 rgba(16,185,129,0.13) !important;
  font-weight: 700 !important;
  margin-top: 10px !important;
  margin-bottom: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  transition: background 0.18s, color 0.18s, transform 0.13s, box-shadow 0.18s !important;
}
.user-friendly-zora-btn:hover, .user-friendly-zora-btn:focus {
  background: linear-gradient(100deg, #059669 0%, #2563eb 100%) !important;
  color: #fff !important;
  transform: translateY(-2px) scale(1.04) !important;
  box-shadow: 0 12px 36px 0 rgba(37,99,235,0.18), 0 2px 12px 0 rgba(16,185,129,0.18) !important;
}
</style>