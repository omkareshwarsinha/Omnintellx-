import express from 'express';
import path from 'path';
import { apiRouter } from './backend/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS & Preflight handling for browser sandbox, iframe previews & external clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount backend API routes FIRST
  app.use('/api', apiRouter);

  // Static release deliverable routes
  const omniPath = path.join(process.cwd(), 'omni');
  const outputOmniPath = path.join(process.cwd(), 'output', 'omni');
  const androidPath = path.join(process.cwd(), 'android');
  const hostingPath = path.join(process.cwd(), 'hosting');
  const finalCodesPath = path.join(process.cwd(), 'final_codes');

  app.use('/omni', express.static(omniPath));
  app.use('/output/omni', express.static(outputOmniPath));
  app.use('/android', express.static(androidPath));
  app.use('/hosting', express.static(hostingPath));
  app.use('/final_codes', express.static(finalCodesPath));

  // Direct APK download route for mobile browsers
  app.get('/download/apk', (req, res) => {
    const apkFile = path.join(androidPath, 'omnintellx.apk');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="omnintellx-android9-release.apk"');
    res.sendFile(apkFile);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'Omnintellx',
      version: '5.0.0',
      timestamp: Date.now()
    });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Omnintellx] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Omnintellx] Failed to start server:', err);
  process.exit(1);
});
