// 2D Game Engine for FZN Farm
const TILE_SIZE = 16;
const ZOOM = 3; // 16 * 3 = 48px on screen

export class GameEngine {
  constructor(canvas, onTileInteract, onShowToast) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onTileInteract = onTileInteract;
    this.onShowToast = onShowToast;

    this.images = {};
    this.assetsLoaded = false;

    // Camera
    this.camera = { x: 0, y: 0 };

    // Player local simulation
    this.player = {
      x: 10 * TILE_SIZE,
      y: 8 * TILE_SIZE,
      speed: 100, // pixels per second
      direction: 'down',
      isMoving: false,
      frame: 0,
      animTimer: 0
    };

    // Keys state
    this.keys = {};

    // Mouse & Tile Selection
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, tileX: 0, tileY: 0 };
    this.selectedTool = null;

    // Visual particles & floating texts
    this.particles = [];
    this.floatingTexts = [];

    // State reference
    this.gameState = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);

    this.initInput();
  }

  async loadAssets() {
    const assetList = [
      { key: 'idle', url: '/assets/Character/Idle.png' },
      { key: 'walk', url: '/assets/Character/Walk.png' },
      { key: 'tileset', url: '/assets/Tileset/Tileset%20Grass%20Spring.png' },
      { key: 'crops', url: '/assets/Objects/Spring%20Crops.png' },
      { key: 'house', url: '/assets/Objects/House.png' },
      { key: 'tree', url: '/assets/Objects/Maple%20Tree.png' },
      { key: 'chest', url: '/assets/Objects/chest.png' },
      { key: 'fence', url: "/assets/Objects/Fence's%20copiar.png" },
      { key: 'road', url: '/assets/Objects/Road%20copiar.png' },
      { key: 'chicken', url: '/assets/Farm%20Animals/Baby%20Chicken%20Yellow.png' }
    ];

    const promises = assetList.map(({ key, url }) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.images[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`[Asset Loader] Warning: could not load ${url}`);
          resolve();
        };
        img.src = url;
      });
    });

    await Promise.all(promises);
    this.assetsLoaded = true;
  }

  initInput() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    this.mouse.worldX = (this.mouse.x - this.canvas.width / 2) / ZOOM + this.camera.x;
    this.mouse.worldY = (this.mouse.y - this.canvas.height / 2) / ZOOM + this.camera.y;

    this.mouse.tileX = Math.floor(this.mouse.worldX / TILE_SIZE);
    this.mouse.tileY = Math.floor(this.mouse.worldY / TILE_SIZE);
  }

  handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    if (!this.gameState) return;

    const tx = this.mouse.tileX;
    const ty = this.mouse.tileY;

    // Check bounds
    if (tx < 0 || tx >= this.gameState.farm.width || ty < 0 || ty >= this.gameState.farm.height) {
      return;
    }

    // Distance check from player (max reach: 3.5 tiles)
    const playerTileX = Math.floor((this.player.x + 16) / TILE_SIZE);
    const playerTileY = Math.floor((this.player.y + 24) / TILE_SIZE);
    const dist = Math.hypot(tx - playerTileX, ty - playerTileY);

    if (dist > 3.8) {
      if (this.onShowToast) {
        this.onShowToast("Muito longe! Aproxime-se para interagir.", "warning");
      }
      return;
    }

    if (this.onTileInteract) {
      this.onTileInteract(tx, ty, this.selectedTool);
    }
  }

  setGameState(state) {
    this.gameState = state;
    if (state.player && state.player.position && !this.initialSync) {
      this.player.x = state.player.position.x * TILE_SIZE;
      this.player.y = state.player.position.y * TILE_SIZE;
      this.initialSync = true;
    }
  }

  setSelectedTool(tool) {
    this.selectedTool = tool;
  }

  addFloatingText(text, worldX, worldY, color = '#ffe600') {
    this.floatingTexts.push({
      text,
      x: worldX,
      y: worldY,
      alpha: 1.0,
      color,
      vy: -25,
      life: 1.2
    });
  }

  addParticleBurst(worldX, worldY, color = '#73cd3b', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        color,
        size: 2 + Math.random() * 2.5,
        alpha: 1.0,
        life: 0.5 + Math.random() * 0.3
      });
    }
  }

  update(dt) {
    if (!this.gameState) return;

    // Movement calculation
    let dx = 0;
    let dy = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.player.isMoving = dx !== 0 || dy !== 0;

    if (this.player.isMoving) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }

      const nextX = this.player.x + dx * this.player.speed * dt;
      const nextY = this.player.y + dy * this.player.speed * dt;

      // Farm bounds
      const minX = 0;
      const maxX = (this.gameState.farm.width - 2) * TILE_SIZE;
      const minY = 0;
      const maxY = (this.gameState.farm.height - 2) * TILE_SIZE;

      this.player.x = Math.max(minX, Math.min(maxX, nextX));
      this.player.y = Math.max(minY, Math.min(maxY, nextY));

      // Walk animation
      this.player.animTimer += dt;
      if (this.player.animTimer >= 0.12) {
        this.player.animTimer = 0;
        this.player.frame = (this.player.frame + 1) % 6;
      }
    } else {
      // Idle animation
      this.player.animTimer += dt;
      if (this.player.animTimer >= 0.25) {
        this.player.animTimer = 0;
        this.player.frame = (this.player.frame + 1) % 4;
      }
    }

    // Camera smoothly follows player
    const targetCamX = this.player.x + 16;
    const targetCamY = this.player.y + 16;
    this.camera.x += (targetCamX - this.camera.x) * (dt * 6);
    this.camera.y += (targetCamY - this.camera.y) * (dt * 6);

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt; // gravity
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background (dirt/pasture ambient color)
    ctx.fillStyle = '#2b4d24';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center camera
    ctx.translate(width / 2, height / 2);
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Turn off smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Farm Tiles
    this.renderFarmGround(ctx);

    // 2. Draw House and Farm Decorations
    this.renderEnvironmentObjects(ctx);

    // 3. Draw Crops
    this.renderCrops(ctx);

    // 4. Draw Tile Selection Highlight
    this.renderHoverTile(ctx);

    // 5. Draw Player Character
    this.renderPlayer(ctx);

    // 6. Draw Particles
    this.renderParticles(ctx);

    // 7. Draw Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderFarmGround(ctx) {
    if (!this.gameState) return;

    const tileset = this.images.tileset;
    const farm = this.gameState.farm;

    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        const key = `${x},${y}`;
        const tile = farm.tiles[key];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (tile && tile.state === 'tilled') {
          // Tilled soil base
          ctx.fillStyle = tile.isWatered ? '#3b2219' : '#6b462b';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          // Soil furrows texture
          ctx.fillStyle = tile.isWatered ? '#26140d' : '#4d2f1a';
          ctx.fillRect(screenX + 2, screenY + 4, 12, 2);
          ctx.fillRect(screenX + 2, screenY + 10, 12, 2);

          // Moist highlight if watered
          if (tile.isWatered) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.2)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        } else {
          // Lush grass tile from tileset
          if (tileset) {
            // Draw center grass tile (e.g. col 1, row 1 from tileset)
            ctx.drawImage(tileset, 16, 16, 16, 16, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = ((x + y) % 2 === 0) ? '#5c9e31' : '#63a835';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  renderEnvironmentObjects(ctx) {
    // Farmhouse at upper-right area of farm (e.g. tile x=14, y=2)
    const houseImg = this.images.house;
    if (houseImg) {
      // The assembled house on the right of House.png is at x=144, y=16, w=72, h=96
      ctx.drawImage(houseImg, 144, 16, 72, 96, 14 * TILE_SIZE, 1 * TILE_SIZE, 72, 96);
    }

    // A cozy maple tree at tile x=2, y=2
    const treeImg = this.images.tree;
    if (treeImg) {
      // Mature tree is at x=96, y=0, w=32, h=48
      ctx.drawImage(treeImg, 96, 0, 32, 48, 2 * TILE_SIZE, 2 * TILE_SIZE, 32, 48);
      ctx.drawImage(treeImg, 96, 0, 32, 48, 4 * TILE_SIZE, 12 * TILE_SIZE, 32, 48);
    }

    // Storage chest near the house
    const chestImg = this.images.chest;
    if (chestImg) {
      ctx.drawImage(chestImg, 0, 0, 16, 16, 13 * TILE_SIZE, 5 * TILE_SIZE, 16, 16);
    }
  }

  renderCrops(ctx) {
    if (!this.gameState) return;
    const cropsImg = this.images.crops;
    if (!cropsImg) return;

    const farm = this.gameState.farm;
    const cropsConfig = this.gameState.cropsConfig || {};

    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        const key = `${x},${y}`;
        const tile = farm.tiles[key];
        if (!tile || !tile.crop) continue;

        const crop = tile.crop;
        const cropDef = cropsConfig[crop.id] || {};
        const rowIndex = cropDef.rowIndex !== undefined ? cropDef.rowIndex : 0;
        const stage = Math.min(crop.stage || 0, (cropDef.stages || 6) - 1);

        const srcX = stage * 16;
        const srcY = rowIndex * 32;

        const destX = x * TILE_SIZE;
        // The crop sprite is 32px high, so offset up by 16px to stand grounded in the 16x16 tile
        const destY = y * TILE_SIZE - 16;

        ctx.drawImage(cropsImg, srcX, srcY, 16, 32, destX, destY, 16, 32);

        // Ready indicator sparkle
        if (crop.ready) {
          const bounce = Math.sin(Date.now() / 200) * 2;
          ctx.fillStyle = '#ffec40';
          ctx.beginPath();
          ctx.arc(destX + 8, destY + bounce + 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  renderHoverTile(ctx) {
    const tx = this.mouse.tileX;
    const ty = this.mouse.tileY;

    if (!this.gameState) return;
    if (tx < 0 || tx >= this.gameState.farm.width || ty < 0 || ty >= this.gameState.farm.height) {
      return;
    }

    const screenX = tx * TILE_SIZE;
    const screenY = ty * TILE_SIZE;

    // Glowing border indicator
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    ctx.fillStyle = 'rgba(255, 230, 0, 0.15)';
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }

  renderPlayer(ctx) {
    const isMoving = this.player.isMoving;
    const img = isMoving ? this.images.walk : this.images.idle;
    if (!img) return;

    let dirRow = 0; // Down
    let flipX = false;

    if (this.player.direction === 'up') {
      dirRow = 1;
    } else if (this.player.direction === 'right') {
      dirRow = 2;
    } else if (this.player.direction === 'left') {
      dirRow = 2;
      flipX = true;
    }

    const frame = this.player.frame;
    const srcX = frame * 32;
    const srcY = dirRow * 32;

    const posX = Math.round(this.player.x);
    const posY = Math.round(this.player.y);

    ctx.save();
    if (flipX) {
      // Flip character horizontally
      ctx.translate(posX + 32, posY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, 32, 32, 0, 0, 32, 32);
    } else {
      ctx.drawImage(img, srcX, srcY, 32, 32, posX, posY, 32, 32);
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  renderFloatingTexts(ctx) {
    ctx.font = '700 8px Rubik, sans-serif';
    ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      // Text drop shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      // Main text
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
  }
}
