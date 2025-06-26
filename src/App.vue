<template>
  <div id="app">
    <main class="app-main">
      <EpubReader ref="epubReaderRef" />
    </main>
    
    <div class="app-info-overlay" v-if="showInfo">
      <div class="info-content">
        <button @click="showInfo = false" class="close-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div class="info-section" id="features">
          <h2>Features</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <h3>EPUB Reading</h3>
              <p>Upload and read EPUB books with smooth pagination and keyboard navigation</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <h3>AI Illustrations</h3>
              <p>Generate beautiful AI-powered illustrations for each page using Cloudflare Workers AI</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="10,6 10,12 16,12"/>
                </svg>
              </div>
              <h3>NFT Minting</h3>
              <p>Mint your favorite AI illustrations as NFTs on Base using the Zora protocol</p>
            </div>
          </div>
        </div>
        
        <div class="info-section" id="about">
          <h2>About AI Books</h2>
          <p>
            AI Books transforms the reading experience by combining traditional EPUB reading with 
            cutting-edge AI technology. As you read, our AI generates beautiful illustrations that 
            bring your stories to life, creating a unique visual narrative alongside the text.
          </p>
          <p>
            Select any text passage to generate custom illustrations, and even mint your most cherished AI-generated artwork as NFTs to preserve and share your reading journey.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EpubReader from './components/EpubReader.vue';

const showInfo = ref(false);
const epubReaderRef = ref();
</script>

<style scoped>
#app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.app-main {
  flex: 1;
}

.app-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.info-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-info {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #86868B;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-info:hover {
  background: #F2F2F7;
  color: #1D1D1F;
}

.info-section {
  margin-bottom: 32px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #1D1D1F;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 20px;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  text-align: center;
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  color: #007AFF;
  margin: 0 auto 12px;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1D1D1F;
}

.feature-card p {
  font-size: 14px;
  color: #86868B;
  line-height: 1.4;
  margin: 0;
}

.info-section p {
  font-size: 16px;
  line-height: 1.6;
  color: #1D1D1F;
  margin: 0 0 16px 0;
}

.info-section p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .info-content {
    padding: 24px;
    margin: 16px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>