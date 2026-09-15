const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const farmEngine = require('./services/farmEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve raw game assets from project root directly
const rootDir = path.resolve(__dirname, '../../');
app.use('/assets/Character', express.static(path.join(rootDir, 'Character')));
app.use('/assets/Farm Animals', express.static(path.join(rootDir, 'Farm Animals')));
app.use('/assets/Objects', express.static(path.join(rootDir, 'Objects')));
app.use('/assets/Tileset', express.static(path.join(rootDir, 'Tileset')));

// Serve production client build if present
const clientDist = path.join(rootDir, 'client', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// API Routes
app.use('/api', apiRoutes);

// Periodic server-side growth tick every 5 seconds
setInterval(() => {
  farmEngine.updateGrowth();
}, 5000);

// Root healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[FZN Backend] Server running on http://localhost:${PORT}`);
  console.log(`[FZN Backend] Authoritative game loop active.`);
});
