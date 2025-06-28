# EPUB AI Reader

[Live Demo](https://ai-epub-reader.vercel.app/)

A modern web application for reading EPUB books, generating AI illustrations, and minting Zora coins (ERC-20) with seamless blockchain and IPFS integration.

## Features
- **EPUB Reader**: Upload and read EPUB books with bookmarks, navigation, and font controls.
- **AI Image Generation**: Summarize the current page or selected text and generate illustrations using Cloudflare Workers AI.
- **Art Style Selection**: Choose from multiple AI art styles (Cyberpunk, Fantasy, Futuristic, Abstract, Retro Wave, Sci-Fi) — your choice is persistent and always used for new images.
- **Zora Coin Minting**: Mint a Zora ERC-20 coin for your book/illustration.

## AI Models Used

- **Image Generation:** [Stable Diffusion XL](https://developers.cloudflare.com/workers-ai/models/image-generation/stable-diffusion-xl/) (via Cloudflare Workers AI)
- **Text Summarization:** [Facebook BART](https://developers.cloudflare.com/workers-ai/models/bart-large-cnn/) (via Cloudflare Workers AI)

> The app uses Cloudflare Workers AI endpoints for both image generation and text summarization. You can swap models or endpoints in the code as needed.

## Screenshot

![EPUB AI Reader Screenshot](screenshort.png)


## Deployment

- Click the button below to deploy your own instance to Vercel with one click:

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/alekcangp/epub-ai-reader)

- Ensure all environment variables are set in the Vercel dashboard (case-sensitive). See `.env.example` for required variables.


## License

MIT
