// 2D Game Engine for FZN Farm — Refined with Collisions, Y-Sorting & World Composition
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
      speed: 105, // pixels per second
      direction: 'down',
      isMoving: false,
      frame: 0,
      animTimer: 0,
      // Hitbox relative to (x, y): 32x32 sprite, hitbox at bottom feet
      hitbox: { offsetX: 10, offsetY: 22, width: 12, height: 8 }
    };

    // World Static Obstacles & Decor
    this.trees = [
      { id: 'tree_1', x: 2 * TILE_SIZE, y: 2 * TILE_SIZE, type: 'maple' },
      { id: 'tree_2', x: 5 * TILE_SIZE, y: 1 * TILE_SIZE, type: 'maple' },
      { id: 'tree_3', x: 1 * TILE_SIZE, y: 8 * TILE_SIZE, type: 'maple' },
      { id: 'tree_4', x: 2 * TILE_SIZE, y: 13 * TILE_SIZE, type: 'maple' },
      { id: 'tree_5', x: 19 * TILE_SIZE, y: 13 * TILE_SIZE, type: 'maple' },
      { id: 'tree_6', x: 21 * TILE_SIZE, y: 7 * TILE_SIZE, type: 'maple' }
    ];

    this.house = {
      x: 14 * TILE_SIZE,
      y: 1 * TILE_SIZE,
      width: 72,
      height: 96
    };

    this.chest = {
      x: 13 * TILE_SIZE,
      y: 5 * TILE_SIZE,
      width: 16,
      height: 16
    };

    // Dirt & stepping stone pathways (world tile coordinates)
    this.pathways = new Set([
      // Path leading from house door (x=18, y=6) to cultivation field
      '18,6', '18,7', '17,7', '16,7', '15,7', '14,7', '13,7', '12,7', '11,7', '10,7', '9,7', '8,7',
      '13,6', '13,5', // towards chest
      '14,8', '14,9', '14,10' // towards south plots
    ]);

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

    // Distance check from player center
    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;
    const tileCenterX = tx * TILE_SIZE + 8;
    const tileCenterY = ty * TILE_SIZE + 8;
    const dist = Math.hypot(tileCenterX - playerCenterX, tileCenterY - playerCenterY) / TILE_SIZE;

    if (dist > 3.5) {
      if (this.onShowToast) {
        this.onShowToast("Muito longe! Aproxime-se do lote.", "warning");
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
      this.camera.x = this.player.x + 16;
      this.camera.y = this.player.y + 16;
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

  // Check collision against all obstacles in the world
  checkCollision(box) {
    if (!this.gameState) return false;

    // 1. World map bounds (leaving 1 tile border for natural trees/fences)
    const minWorldX = 0.5 * TILE_SIZE;
    const maxWorldX = (this.gameState.farm.width - 1.5) * TILE_SIZE;
    const minWorldY = 0.5 * TILE_SIZE;
    const maxWorldY = (this.gameState.farm.height - 1.5) * TILE_SIZE;

    if (box.x < minWorldX || (box.x + box.w) > maxWorldX ||
        box.y < minWorldY || (box.y + box.h) > maxWorldY) {
      return true;
    }

    // Helper for AABB collision
    const intersects = (a, b) => {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    };

    // 2. Farmhouse solid collision (Base walls with opening for front door)
    // House at x=14 * 16 = 224, y=1 * 16 = 16, w=72, h=96
    // Left wall: x: 226, y: 64, w: 46, h: 36
    const houseLeftWall = { x: this.house.x + 2, y: this.house.y + 48, w: 42, h: 48 };
    if (intersects(box, houseLeftWall)) return true;

    // Right wall (next to door): x: 278, y: 64, w: 18, h: 36
    const houseRightWall = { x: this.house.x + 58, y: this.house.y + 48, w: 14, h: 48 };
    if (intersects(box, houseRightWall)) return true;

    // Top roof & chimney collision
    const houseRoof = { x: this.house.x + 4, y: this.house.y + 20, w: 64, h: 32 };
    if (intersects(box, houseRoof)) return true;

    // 3. Storage Chest
    const chestBox = { x: this.chest.x + 1, y: this.chest.y + 4, w: 14, h: 12 };
    if (intersects(box, chestBox)) return true;

    // 4. Maple Trees (Trunks solid at the base)
    for (const tree of this.trees) {
      // Tree is 32x48, trunk is at (x + 10, y + 36), size: 12x10
      const trunkBox = { x: tree.x + 10, y: tree.y + 36, w: 12, h: 10 };
      if (intersects(box, trunkBox)) return true;
    }

    // 5. Perimeter Fences
    // Top border fence (except path gap)
    const topFence = { x: 7 * TILE_SIZE, y: 1 * TILE_SIZE, w: 6 * TILE_SIZE, h: 12 };
    if (intersects(box, topFence)) return true;

    return false;
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

      // Smooth collision resolution with independent X & Y axis checking (wall sliding)
      const moveDistX = dx * this.player.speed * dt;
      const moveDistY = dy * this.player.speed * dt;

      // Test X movement
      const testBoxX = {
        x: this.player.x + moveDistX + this.player.hitbox.offsetX,
        y: this.player.y + this.player.hitbox.offsetY,
        w: this.player.hitbox.width,
        h: this.player.hitbox.height
      };

      if (!this.checkCollision(testBoxX)) {
        this.player.x += moveDistX;
      }

      // Test Y movement
      const testBoxY = {
        x: this.player.x + this.player.hitbox.offsetX,
        y: this.player.y + moveDistY + this.player.hitbox.offsetY,
        w: this.player.hitbox.width,
        h: this.player.hitbox.height
      };

      if (!this.checkCollision(testBoxY)) {
        this.player.y += moveDistY;
      }

      // Walk animation
      this.player.animTimer += dt;
      if (this.player.animTimer >= 0.11) {
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

    // Camera smoothly follows player with bounds clamping
    const targetCamX = this.player.x + 16;
    const targetCamY = this.player.y + 16;
    this.camera.x += (targetCamX - this.camera.x) * (dt * 7);
    this.camera.y += (targetCamY - this.camera.y) * (dt * 7);

    // Camera Clamping: prevent viewing outside farm
    const worldWidth = this.gameState.farm.width * TILE_SIZE;
    const worldHeight = this.gameState.farm.height * TILE_SIZE;
    const halfViewW = (this.canvas.width / 2) / ZOOM;
    const halfViewH = (this.canvas.height / 2) / ZOOM;

    if (worldWidth > halfViewW * 2) {
      this.camera.x = Math.max(halfViewW, Math.min(worldWidth - halfViewW, this.camera.x));
    }
    if (worldHeight > halfViewH * 2) {
      this.camera.y = Math.max(halfViewH, Math.min(worldHeight - halfViewH, this.camera.y));
    }

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

    // Clear background with rich forest green
    ctx.fillStyle = '#1e3819';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center camera
    ctx.translate(width / 2, height / 2);
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Turn off smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Farm Ground (Grass, Tilled soil, Watered highlight, Stone paths)
    this.renderFarmGround(ctx);

    // 2. Draw Fences (Perimeter and decor)
    this.renderFences(ctx);

    // 3. Draw Depth-Sorted Entities (Y-Sorting: Character, House, Trees, Chest, Crops)
    this.renderDepthSortedEntities(ctx);

    // 4. Draw Tile Selection Highlight
    this.renderHoverTile(ctx);

    // 5. Draw Particles
    this.renderParticles(ctx);

    // 6. Draw Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderFarmGround(ctx) {
    if (!this.gameState) return;

    const tileset = this.images.tileset;
    const roadImg = this.images.road;
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
            ctx.fillStyle = 'rgba(70, 150, 240, 0.25)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        } else {
          // Lush grass tile from tileset
          if (tileset) {
            // Draw center lush grass tile
            ctx.drawImage(tileset, 16, 16, 16, 16, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = ((x + y) % 2 === 0) ? '#5c9e31' : '#63a835';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }

          // Stepping stone pathways
          if (this.pathways.has(key) && roadImg) {
            // Sample stepping stone tile from Road copiar.png
            ctx.drawImage(roadImg, 0, 0, 16, 16, screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  renderFences(ctx) {
    const fenceImg = this.images.fence;
    if (!fenceImg) return;

    // Fence section above the cultivation plots (e.g. y=1, from x=7 to x=12)
    for (let x = 7; x <= 12; x++) {
      ctx.drawImage(fenceImg, 0, 32, 16, 16, x * TILE_SIZE, 1 * TILE_SIZE, 16, 16);
    }
  }

  renderDepthSortedEntities(ctx) {
    if (!this.gameState) return;

    const entities = [];

    // 1. Storage Chest
    entities.push({
      sortY: this.chest.y + 16,
      render: () => {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(this.chest.x + 8, this.chest.y + 14, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        const chestImg = this.images.chest;
        if (chestImg) {
          ctx.drawImage(chestImg, 0, 0, 16, 16, this.chest.x, this.chest.y, 16, 16);
        }
      }
    });

    // 2. Farmhouse
    entities.push({
      sortY: this.house.y + 90, // Base of front walls
      render: () => {
        // Building base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.house.x + 4, this.house.y + 88, 64, 8);

        const houseImg = this.images.house;
        if (houseImg) {
          ctx.drawImage(houseImg, 144, 16, 72, 96, this.house.x, this.house.y, 72, 96);
        }
      }
    });

    // 3. Maple Trees
    for (const tree of this.trees) {
      entities.push({
        sortY: tree.y + 44, // Base of trunk
        render: () => {
          // Soft oval shadow under tree canopy
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(tree.x + 16, tree.y + 44, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          const treeImg = this.images.tree;
          if (treeImg) {
            ctx.drawImage(treeImg, 96, 0, 32, 48, tree.x, tree.y, 32, 48);
          }
        }
      });
    }

    // 4. Crops
    const cropsImg = this.images.crops;
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

        const destX = x * TILE_SIZE;
        const destY = y * TILE_SIZE - 16;
        const sortY = y * TILE_SIZE + 14;

        entities.push({
          sortY,
          render: () => {
            if (cropsImg) {
              ctx.drawImage(cropsImg, stage * 16, rowIndex * 32, 16, 32, destX, destY, 16, 32);
            }

            // Ready indicator sparkle
            if (crop.ready) {
              const bounce = Math.sin(Date.now() / 200) * 2;
              ctx.fillStyle = '#ffec40';
              ctx.beginPath();
              ctx.arc(destX + 8, destY + bounce + 4, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }
    }

    // 5. Player Character
    entities.push({
      sortY: this.player.y + 28, // Feet coordinate
      render: () => {
        this.renderPlayer(ctx);
      }
    });

    // Sort entities ascending by sortY
    entities.sort((a, b) => a.sortY - b.sortY);

    // Render in sorted order
    for (const entity of entities) {
      entity.render();
    }
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

    // Soft grounded drop shadow under character feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(posX + 16, posY + 28, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

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

  renderHoverTile(ctx) {
    const tx = this.mouse.tileX;
    const ty = this.mouse.tileY;

    if (!this.gameState) return;
    if (tx < 0 || tx >= this.gameState.farm.width || ty < 0 || ty >= this.gameState.farm.height) {
      return;
    }

    const screenX = tx * TILE_SIZE;
    const screenY = ty * TILE_SIZE;

    // Check reach distance
    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;
    const tileCenterX = tx * TILE_SIZE + 8;
    const tileCenterY = ty * TILE_SIZE + 8;
    const inReach = (Math.hypot(tileCenterX - playerCenterX, tileCenterY - playerCenterY) / TILE_SIZE) <= 3.5;

    // Glowing border indicator: Golden green when in reach, soft muted when out of reach
    ctx.strokeStyle = inReach ? '#4ade80' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    ctx.fillStyle = inReach ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
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
