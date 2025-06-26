# EPUB AI Reader

A modern Vue 3 + Vite application for reading EPUB books, generating AI illustrations, and minting Zora coins (ERC20) with seamless blockchain and IPFS integration.

## Features
- **EPUB Reader**: Upload and read EPUB books with bookmarks, navigation, and font controls.
- **AI Image Generation**: Summarize current page and generate illustrations using Cloudflare Workers AI.
- **Zora Coin Minting**: Mint a Zora ERC20 coin for your book/illustration, with MetaMask and Base Sepolia support.
- **IPFS Integration**: Upload images and metadata to IPFS via Pinata.
- **MetaMask Wallet**: Connect, switch networks, and mint directly from your browser.
- **Modern UI/UX**: Touch-friendly, accessible, and beautiful interface.

## Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment variables:**
   Set these in your Vercel dashboard or a local `.env` file:
   - `CLOUDFLARE_ACCOUNT_ID` (Cloudflare AI)
   - `CLOUDFLARE_API_TOKEN` (Cloudflare AI)
   - `PINATA_API_KEY` (Pinata IPFS)
   - `PINATA_API_SECRET` (Pinata IPFS)

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment
- Deploy to Vercel for best results (supports serverless API routes for AI and IPFS integration).
- Ensure all environment variables are set in the Vercel dashboard (case-sensitive).

## Project Structure
- `src/` — Main Vue app (components, services, types)
- `api/` — Vercel serverless functions for Cloudflare AI and Pinata
- `public/` — Static assets (MetaMask icon, etc.)

## License
MIT
