import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');

// Check if dist folder exists and list contents
if (!fs.existsSync(distPath)) {
  console.error('ERROR: dist folder not found! Make sure to run build first.');
} else {
  console.log('dist folder contents:', fs.readdirSync(distPath));
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('assets folder contents:', fs.readdirSync(assetsPath).slice(0, 10), '...');
  }
}

// Serve static files from dist directory with proper MIME types
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // Set correct MIME types
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.woff') || filePath.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    } else if (filePath.endsWith('.html')) {
      // Don't cache HTML files - always get fresh version
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    // Cache static assets (JS, CSS, images) with content hash in filename
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/) && !filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Service worker should not be cached
    if (filePath.endsWith('sw.js') || filePath.endsWith('workbox')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Handle requests for JS/CSS files that don't exist - return 404 instead of index.html
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (['.js', '.css', '.map', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
    // Log missing file for debugging
    console.log(`404 - File not found: ${req.path}`);
    res.status(404).send(`File not found: ${req.path}`);
    return;
  }
  next();
});

// Handle client-side routing - serve index.html for all other routes
app.get('*', (req, res) => {
  // Don't cache HTML responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from: ${distPath}`);
});
