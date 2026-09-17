const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initSchema } = require('./db/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve assets directly from root /assets directory
const rootDir = path.resolve(__dirname, '../../');
const assetsDir = path.join(rootDir, 'assets');

app.use('/assets', express.static(assetsDir));
app.use('/assets/Character', express.static(path.join(assetsDir, 'Character')));
app.use('/assets/Farm Animals', express.static(path.join(assetsDir, 'Farm Animals')));
app.use('/assets/Objects', express.static(path.join(assetsDir, 'Objects')));
app.use('/assets/tiles', express.static(path.join(assetsDir, 'tiles')));
app.use('/assets/Tileset', express.static(path.join(assetsDir, 'Tileset')));
app.use('/assets/crops', express.static(path.join(assetsDir, 'crops')));

// Serve production client build
const clientDist = path.join(rootDir, 'client', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// API Routes
app.use('/api', apiRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  try {
    const row = db.prepare('SELECT 1 as alive').get();
    res.json({ status: 'ok', db: row.alive === 1, time: Date.now() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Catch-all route for SPA client routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
    return next();
  }
  const indexHtml = path.join(clientDist, 'index.html');
  if (require('fs').existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

initSchema();

app.listen(PORT, () => {
  console.log(`[FZN Server] Autoritativo rodando em http://localhost:${PORT}`);
  console.log(`[FZN Server] SQLite WAL mode ativo com integridade transacional.`);
});

module.exports = app;
