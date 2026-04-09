import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';
import express from 'express';

// Suppress warnings
process.env.NODE_NO_WARNINGS = '1';

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { 
          overlay: false,
          port: 24679  // Use different port
        }
      },
      appType: 'spa',
    });
    
    // Use Vite only for non-API requests
    app.use((req, res, next) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
        next();
      } else {
        vite.middlewares(req, res, next);
      }
    });
  } else {
    // Serve static files from dist directory
    app.use(express.static('dist', {
      index: 'index.html',
      maxAge: '1d'
    }));
    
    // Handle SPA routing - serve index.html for all non-API routes
    app.get('/:path*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile('dist/index.html', { root: '.' });
      } else {
        res.status(404).json({ message: 'API endpoint not found' });
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HR System ready at http://localhost:${PORT}`);
    console.log('📱 Mobile responsive design enabled');
    console.log('🔐 Login: Admin (012345678 / password123)');
  });
}

startServer();
