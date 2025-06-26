/// <reference types="vite/client" />

declare global {
  interface Window {
    lastOpenedBookArrayBuffer?: ArrayBuffer;
  }
}
