<template>
  <div class="file-upload-container">
    <div 
      class="upload-zone"
      :class="{ 'dragover': isDragOver, 'has-file': hasFile }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".epub"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div class="upload-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </div>
      
      <div class="upload-text">
        <h3>{{ hasFile ? fileName : 'Upload EPUB Book' }}</h3>
        <p>{{ hasFile ? 'Click to change file' : 'Drag and drop or click to select an EPUB file' }}</p>
      </div>
      
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Processing EPUB...</p>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ isLoading?: boolean; error?: string }>();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const hasFile = ref(false);
const fileName = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && file.type === 'application/epub+zip') {
    hasFile.value = true;
    fileName.value = file.name;
    emit('fileSelected', file);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const file = event.dataTransfer?.files[0];
  if (file && file.type === 'application/epub+zip') {
    hasFile.value = true;
    fileName.value = file.name;
    emit('fileSelected', file);
  }
};

defineExpose({ triggerFileInput });
</script>

<style scoped>
.file-upload-container {
  max-width: 480px;
  margin: 0 auto;
}

.upload-zone {
  border: 2px dashed #007AFF;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 122, 255, 0.02);
  position: relative;
}

.upload-zone:hover {
  border-color: #0056CC;
  background: rgba(0, 122, 255, 0.05);
  transform: translateY(-2px);
}

.upload-zone.dragover {
  border-color: #5AC8FA;
  background: rgba(90, 200, 250, 0.1);
  transform: scale(1.02);
}

.upload-zone.has-file {
  border-color: #34C759;
  background: rgba(52, 199, 89, 0.05);
}

.upload-icon {
  color: #007AFF;
  margin-bottom: 16px;
}

.upload-zone.has-file .upload-icon {
  color: #34C759;
}

.upload-text h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1D1D1F;
}

.upload-text p {
  font-size: 14px;
  color: #86868B;
  margin: 0;
  line-height: 1.4;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E5EA;
  border-top: 3px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-indicator p {
  margin: 0;
  font-size: 14px;
  color: #1D1D1F;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  border-radius: 8px;
  font-size: 14px;
}
</style>