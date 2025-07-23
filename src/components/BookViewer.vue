<template>
  <div class="book-viewer">
    <!-- Centered loading spinner overlay -->
    <div v-if="props.isLoadingBook" class="loading-overlay">
      <div class="spinner"></div>
    </div>
    <!-- Removed viewer-header (book-info and page-info) -->
    <div ref="epubContainer" class="epub-container-fixed"></div>
    <!--
    <div v-if="selectedText" class="selection-panel">
      <div class="selection-info">
        <h4>Selected Text</h4>
        <p class="selected-content">"{{ selectedText }}"</p>
        <div class="selection-actions">
          <button @click="generateImageForSelection" class="primary-btn">
            Generate Image
          </button>
          <button @click="clearSelection" class="secondary-btn">
            Clear Selection
          </button>
        </div>
      </div>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { BookMetadata } from '../types/epub';
import ePub from 'epubjs';

const props = defineProps<{ currentCfi: string | null; metadata: BookMetadata | null; isLoadingBook?: boolean; fontSize?: number; totalPages?: number }>();

const emit = defineEmits<{
  (e: 'pageChange', payload: { page: number; total: number; cfi: string }): void;
  (e: 'textSelected', text: string): void;
  (e: 'bookReady'): void;
}>();

const epubContainer = ref(null);
let rendition: any = null;
let epubBook: any = null;

const pageInputValue = ref<number>(1);
const totalPages = ref<number>(1);
const selectedText = ref('');

// Font size state
const FONT_SIZE_KEY = 'epub-font-size';
const fontSize = ref<number>(parseInt(localStorage.getItem(FONT_SIZE_KEY) || '100', 10)); // percent

let pendingCfiCheck: { requested: string | null, triedFallback: boolean } | null = null;

// Watch for CFI prop changes
watch(
  () => props.currentCfi,
  (newCfi) => {
    if (
      newCfi &&
      rendition &&
      typeof rendition.currentLocation === 'function' &&
      rendition.currentLocation() &&
      rendition.currentLocation().start &&
      rendition.currentLocation().start.cfi !== newCfi
    ) {
      rendition.display(newCfi);
  }
  }
);

watch(
  () => props.metadata,
  async (newVal) => {
    if (newVal && (window as any).lastOpenedBookArrayBuffer) {
      try {
        // Clean up any existing book/rendition
        if (rendition) {
          rendition.destroy();
        }
        if (epubBook) {
          epubBook.destroy();
        }
        
        // Initialize new book
        epubBook = ePub((window as any).lastOpenedBookArrayBuffer);
        
        // Wait for book to be ready before proceeding
        await epubBook.ready;
        
        // Initialize rendition
        rendition = epubBook.renderTo(epubContainer.value, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
        });
        
        // Generate locations
        try {
          await epubBook.locations.generate(1024); // 1024 chars per page
          totalPages.value = epubBook.locations.length();
        } catch (error) {
          // Continue even if locations fail - not critical
        }
        
        // Only display the correct CFI ONCE after initializing rendition and locations
        if (props.currentCfi) {
          await rendition.display(props.currentCfi);
          pendingCfiCheck = { requested: props.currentCfi, triedFallback: false };
        } else {
          await rendition.display();
        }
        // Extra robustness: if currentCfi exists after ready, display it again
        setTimeout(() => {
          if (props.currentCfi) {
            rendition.display(props.currentCfi);
            pendingCfiCheck = { requested: props.currentCfi, triedFallback: false };
          }
        }, 100);
        // Always apply the font size after book is loaded and displayed
        if (props.fontSize) {
          rendition.themes.fontSize(props.fontSize + '%');
        } else {
          rendition.themes.fontSize('100%');
        }
        emit('bookReady');
        
        // Set up event listeners
        rendition.on('relocated', async (location: any) => {
          if (epubBook && epubBook.locations) {
            const total = epubBook.locations.length();
            const current = epubBook.locations.locationFromCfi(location.start.cfi) + 1;
            emit('pageChange', { page: current, total, cfi: location.start.cfi });
            // Robust fallback for end-of-book/chapter
            if (pendingCfiCheck && pendingCfiCheck.requested) {
              const actual = location.start.cfi;
              const requested = pendingCfiCheck.requested;
              if (actual !== requested && !pendingCfiCheck.triedFallback) {
                // If the requested CFI is at/near the end, jump to the last valid CFI
                const lastCfi = epubBook.locations.cfiFromLocation(epubBook.locations.length() - 1);
                if (requested >= lastCfi) {
                  console.log('[BookViewer] Fallback: requested CFI at/near end, jumping to last valid CFI', lastCfi);
                  pendingCfiCheck.triedFallback = true;
                  await rendition.display(lastCfi);
                } else {
                  console.log('[BookViewer] CFI mismatch but not at end:', { requested, actual });
                  pendingCfiCheck = null;
                }
              } else {
                pendingCfiCheck = null;
              }
            }
          }
        });
        
      } catch (error) {
        // Notify parent of error
        emit('bookReady'); // Still emit to clear loading state
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.fontSize,
  async (newFontSize) => {
    if (rendition) {
      // Always apply the font size, even if the value is the same
      rendition.themes.fontSize((newFontSize || 100) + '%');
      // After font size change, recalculate current CFI and emit pageChange
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for reflow
      const loc = rendition.currentLocation?.();
      if (loc && loc.start && loc.start.cfi && epubBook && epubBook.locations) {
        const total = epubBook.locations.length();
        const current = epubBook.locations.locationFromCfi(loc.start.cfi) + 1;
        emit('pageChange', { page: current, total, cfi: loc.start.cfi });
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  const lastPart = props.currentCfi ? props.currentCfi.split(':').pop() ?? '' : '';
  pageInputValue.value = lastPart ? parseInt(lastPart, 10) : 1;
  // Restore font size from localStorage
  const saved = localStorage.getItem(FONT_SIZE_KEY);
  if (saved) fontSize.value = parseInt(saved, 10);

  // Add selection listener to EPUB content
  const addSelectionListener = () => {
    if (!rendition) return;
    rendition.on('rendered', (_section: any) => {
      const iframe = (epubContainer.value as HTMLElement | null)?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        const doc = iframe.contentWindow.document;
        let lastEmittedSelection = '';
        // Only emit on mouseup, not on every selectionchange
        const handleMouseUp = () => {
          const sel = doc.getSelection();
          const text = sel ? sel.toString().trim() : '';
          if (text.length > 0 && text !== lastEmittedSelection) {
            lastEmittedSelection = text;
            selectedText.value = text;
            emit('textSelected', text);
          }
        };
        doc.addEventListener('mouseup', handleMouseUp);
        // Inject keydown listener for navigation
        doc.removeEventListener('keydown', injectedNavKeydown, true); // Remove if already attached
        doc.addEventListener('keydown', injectedNavKeydown, true);
      }
    });
  };
  setTimeout(addSelectionListener, 1000);
});

onUnmounted(() => {
  // Remove from onUnmounted
  // window.removeEventListener('keydown', handleKeyboard, true);
});

function nextPage() {
  if (rendition) {
    rendition.next();
  }
}
function previousPage() {
  if (rendition) {
    rendition.prev();
  }
}

function getCurrentCfi() {
  if (!rendition) return null;
  const loc = rendition.currentLocation?.();
  return loc && loc.start && loc.start.cfi ? loc.start.cfi : null;
}

function goToCfi(cfi: string) {
  if (rendition && cfi) rendition.display(cfi);
}

async function getCurrentPageText() {
  if (!rendition || !epubBook || !epubBook.locations) return '';
  const loc = rendition.currentLocation?.();
  
  if (!loc || !loc.start || !loc.start.cfi) return '';
  let startCfi = loc.start.cfi;

  // Try to get the current page index in the locations array
  let pageIndex = null;
  //if (loc.start.index !== undefined) {
   // pageIndex = loc.start.index;
  //  
 // } else {
    // Fallback: use pageFromCfi (1-based)
    pageIndex = epubBook.locations.locationFromCfi(startCfi);
  //}

  // Use cfiFromLocation for more accurate CFI calculation
  if (pageIndex !== null && pageIndex >= 0) {
    startCfi = epubBook.locations.cfiFromLocation(pageIndex);
  }

  if (!startCfi) return '';

  try {
    let range = epubBook.getRange(startCfi);
    if (range instanceof Promise) {
      range = await range;
    }
    const text = range?.toString() || '';
    //console.log(pageIndex + ' ' + text)
    return text.replace(/\s+/g, ' ').trim();
  } catch (e) {
    // fallback: get all visible text as before
    const contents = rendition.getContents();
    if (!contents || !contents.length) return '';
    return contents[0].document.body.innerText || '';
  }
}

function injectedNavKeydown(event: KeyboardEvent) {
  const tag = (event.target as HTMLElement)?.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable;
  if (isInput) return;
  if (event.key === 'ArrowLeft') {
    previousPage();
    event.preventDefault();
  } else if (event.key === 'ArrowRight') {
    nextPage();
    event.preventDefault();
  }
}

// Find the CFI for a given text snippet (used for robust bookmarks)
async function findCfiForSnippet(snippet: string): Promise<string | null> {
  if (!epubBook || !epubBook.spine) return null;
  for (let i = 0; i < epubBook.spine.length; i++) {
    const section = epubBook.spine.get(i);
    if (!section) continue;
    try {
      const text = await section.load().then((sec: any) => sec?.contents?.textContent || '');
      const idx = text.indexOf(snippet);
      if (idx !== -1) {
        // Get CFI for this position
        const cfi = section.cfiFromTextLocation(idx);
        if (cfi) return cfi;
      }
    } catch (e) { /* ignore */ }
  }
  return null;
}

defineExpose({ nextPage, previousPage, getCurrentCfi, goToCfi, getCurrentPageText, findCfiForSnippet });
</script>

<style scoped>
.book-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 800px;
  background: rgb(239,226,204);
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
  margin: 0;
  position: relative;
  justify-content: stretch;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 12px 20px;
  border-bottom: 1px solid #E5E5EA;
  background: white;
  margin: 0;
}

.book-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.book-cover {
  width: auto;
  height: 100%;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: block;
}

.book-info h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #1D1D1F;
}

.book-info p {
  font-size: 14px;
  color: #86868B;
  margin: 0;
}

.page-info {
  font-size: 14px;
  color: #86868B;
  font-weight: 500;
  margin-left: 12px;
}

.page-content {
  flex: 1;
  padding: 18px 20px 18px 20px;
  overflow-y: auto;
  line-height: 1.6;
  margin: 0;
}

.page-text {
  font-size: 16px;
  color: #1D1D1F;
  width: 100%;
  margin: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
  padding: 0;
}

.page-text :deep(p) {
  margin: 0 0 14px 0;
  text-align: justify;
}

.no-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #86868B;
  margin: 0;
  padding: 0;
}

.selection-panel {
  margin-top: 10px;
  padding: 12px 18px;
  background: rgba(0, 122, 255, 0.05);
  border-top: 1px solid #007AFF;
}

.selection-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1D1D1F;
}

.selected-content {
  font-size: 14px;
  font-style: italic;
  color: #1D1D1F;
  margin: 0 0 10px 0;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #007AFF;
}

.selection-actions {
  display: flex;
  gap: 8px;
  margin: 0;
}

.primary-btn {
  padding: 8px 16px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
}

.primary-btn:hover {
  background: #0056CC;
  transform: translateY(-1px);
}

.secondary-btn {
  padding: 8px 16px;
  background: transparent;
  color: #007AFF;
  border: 1px solid #007AFF;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
}

.secondary-btn:hover {
  background: rgba(0, 122, 255, 0.1);
}

.cover-fullpage {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
}

.epub-container-fixed {
  position: relative;
  
  height: 100%;

  background: rgb(239,226,204);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}



.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 6px solid #e0e0e0;
  border-top: 6px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Make navigation always at the bottom */
.book-viewer {
  min-height: 0;
  height: 100%;
}

.book-viewer {
  display: flex;
  flex-direction: column;
}


.viewer-controls {
  flex-shrink: 0;
}

/* Center epub container in available space, navigation stays at bottom */
.book-viewer-main {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: transparent;
}



::v-deep .epub-container-fixed * {
  height: 100% !important;
  min-height: 100% !important;
  box-sizing: border-box;
}
</style>