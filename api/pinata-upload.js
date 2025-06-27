// import type { VercelRequest, VercelResponse } from '@vercel/node';

import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { validateMetadataJSON } from '@zoralabs/coins-sdk';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('Received request:', req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.error('Pinata API credentials not set');
    return res.status(500).json({ error: 'Pinata API credentials not set' });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(400).json({ error: 'Form parse error' });
    }
    try {
      console.log('Form fields:', fields);
      console.log('Form files:', files);
      let file = files.file;
      if (Array.isArray(file)) file = file[0];
      console.log('File object:', file);
      if (!file || !file.filepath) {
        console.error('No file uploaded or file missing filepath:', file);
        return res.status(400).json({ error: 'No file uploaded or file missing filepath' });
      }
      const metadataStr = Array.isArray(fields.metadata) ? fields.metadata[0] : fields.metadata;
      if (!metadataStr) {
        console.error('Missing metadata');
        throw new Error('Missing metadata');
      }
      const metadata = JSON.parse(metadataStr);
      // 1. Upload the image file to Pinata
      const fileStream = fs.createReadStream(file.filepath);
      const data = new FormData();
      data.append('file', fileStream, file.originalFilename);
      // Add pinataOptions for CIDv1
      const pinataOptions = {
        cidVersion: 1
      };
      data.append('pinataOptions', JSON.stringify(pinataOptions));
      const headers = {
        ...data.getHeaders(),
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      };
      const fileRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: data,
      });
      const fileJson = await fileRes.json();
      if (!fileRes.ok || !fileJson.IpfsHash) {
        throw new Error('Pinata file upload failed: ' + JSON.stringify(fileJson));
      }
      const imageIpfsUrl = `https://gateway.pinata.cloud/ipfs/${fileJson.IpfsHash}`;
      
      // 2. Create metadata with image URL
      const metadataWithImage = { ...metadata, image: `ipfs://${fileJson.IpfsHash}` };
      
      // Validate metadata
      console.log('Metadata with image:', metadataWithImage);
      // Validate metadata before uploading to Pinata
      const validation = validateMetadataJSON(metadataWithImage);
      console.log('Metadata validation:', validation);
      if (!validation) {
        console.error('Metadata validation failed:', validation.errors);
        return res.status(400).json({ error: 'Metadata validation failed: ' + (validation.errors?.[0]?.message || 'Invalid metadata') });
      }

      // 3. Upload metadata JSON to Pinata
      const metaRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
        body: JSON.stringify({
          pinataOptions: { cidVersion: 1 },
          pinataContent: metadataWithImage
        }),
      });
      const metaJson = await metaRes.json();
      if (!metaRes.ok || !metaJson.IpfsHash) {
        throw new Error('Pinata metadata upload failed: ' + JSON.stringify(metaJson));
      }
      const metadataIpfsUrl = `ipfs://${metaJson.IpfsHash}`;
      res.status(200).json({ imageIpfsUrl, metadataIpfsUrl });
    } catch (error) {
      console.error('Pinata upload error:', error);
      res.status(500).json({ error: error.message || 'Pinata upload failed' });
    }
  });
} 