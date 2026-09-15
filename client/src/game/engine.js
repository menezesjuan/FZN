import { audio } from './audio';

// 2D Game Engine for FZN Farm — Refined with Collisions, Y-Sorting & World Composition
const TILE_SIZE = 16;
const ZOOM = 3; // 16 * 3 = 48px on screen

export class GameEngine {
  constructor(canvas, onTileInteract, onShowToast, onInteractDoor, onCollectEgg, onChopTree) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onTileInteract = onTileInteract;
    this.onShowToast = onShowToast;
    this.onInteractDoor = onInteractDoor;
    this.onCollectEgg = onCollectEgg;
    this.onChopTree = onChopTree;
    this.isNearDoor = false;
    this.treeShakes = {};

    // Pasture animals (Chickens and chicks)
    this.animals = [
      { id: 'chicken_1', type: 'adult', name: 'Gertrudes', x: 20 * TILE_SIZE, y: 3 * TILE_SIZE, targetX: 20 * TILE_SIZE, targetY: 3 * TILE_SIZE, state: 'idle', stateTimer: 2, frame: 0, animTimer: 0, flipX: false },
      { id: 'chick_1', type: 'chick', name: 'Piu-Piu', x: 19 * TILE_SIZE, y: 4 * TILE_SIZE, targetX: 19 * TILE_SIZE, targetY: 4 * TILE_SIZE, state: 'idle', stateTimer: 1.5, frame: 0, animTimer: 0, flipX: false },
      { id: 'chick_2', type: 'chick', name: 'Amarelinho', x: 21 * TILE_SIZE, y: 4 * TILE_SIZE, targetX: 21 * TILE_SIZE, targetY: 4 * TILE_SIZE, state: 'idle', stateTimer: 2.2, frame: 0, animTimer: 0, flipX: true }
    ];

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
      actionTimer: 0,
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
      { key: 'chicken', url: '/assets/Farm%20Animals/Baby%20Chicken%20Yellow.png' },
      { key: 'chicken_adult', url: '/assets/Farm%20Animals/Chicken%20Blonde%20%20Green.png' }
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
    if (e.code === 'KeyE' && this.isNearDoor) {
      if (this.onInteractDoor) {
        this.onInteractDoor();
      }
    }
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

    // Check if clicked on an egg
    if (this.gameState.farm.eggs && this.gameState.farm.eggs.length > 0) {
      const clickedEgg = this.gameState.farm.eggs.find(egg => {
        const eggCenterX = egg.x * TILE_SIZE + 8;
        const eggCenterY = egg.y * TILE_SIZE + 8;
        return Math.hypot(eggCenterX - this.mouse.worldX, eggCenterY - this.mouse.worldY) < 14;
      });

      if (clickedEgg) {
        const eggCenterX = clickedEgg.x * TILE_SIZE + 8;
        const eggCenterY = clickedEgg.y * TILE_SIZE + 8;
        const dist = Math.hypot(eggCenterX - playerCenterX, eggCenterY - playerCenterY) / TILE_SIZE;

        if (dist > 3.5) {
          if (this.onShowToast) {
            this.onShowToast("Muito longe para pegar o ovo! Aproxime-se.", "warning");
          }
          return;
        }

        if (this.onCollectEgg) {
          this.onCollectEgg(clickedEgg.id, clickedEgg.x, clickedEgg.y);
          return;
        }
      }
    }

    // Check if clicked on an animal (petting interaction)
    const clickedAnimal = this.animals.find(animal => {
      const animalCenterX = animal.x + 8;
      const animalCenterY = animal.y + 8;
      return Math.hypot(animalCenterX - this.mouse.worldX, animalCenterY - this.mouse.worldY) < 14;
    });

    if (clickedAnimal) {
      const dist = Math.hypot(clickedAnimal.x + 8 - playerCenterX, clickedAnimal.y + 8 - playerCenterY) / TILE_SIZE;
      if (dist <= 3.5) {
        if (clickedAnimal.type === 'adult') {
          audio.playCluck();
        } else {
          audio.playChirp();
        }
        this.addFloatingText("❤️", clickedAnimal.x + 8, clickedAnimal.y - 4, '#ff6b81');
        this.addParticleBurst(clickedAnimal.x + 8, clickedAnimal.y + 4, '#f472b6', 6);
        return;
      }
    }

    // Check if clicked on a tree or stump
    const clickedTree = this.trees.find(tree => {
      return (
        this.mouse.worldX >= tree.x &&
        this.mouse.worldX <= tree.x + 32 &&
        this.mouse.worldY >= tree.y &&
        this.mouse.worldY <= tree.y + 48
      );
    });

    if (clickedTree) {
      const treeCenterX = clickedTree.x + 16;
      const treeCenterY = clickedTree.y + 36;
      const dist = Math.hypot(treeCenterX - playerCenterX, treeCenterY - playerCenterY) / TILE_SIZE;

      if (dist > 3.5) {
        if (this.onShowToast) {
          this.onShowToast("Muito longe da árvore! Aproxime-se do tronco.", "warning");
        }
        return;
      }

      if (this.selectedTool && this.selectedTool.id === 'tool_axe') {
        const txTarget = clickedTree.tileX !== undefined ? clickedTree.tileX : Math.floor(clickedTree.x / TILE_SIZE);
        const tyTarget = clickedTree.tileY !== undefined ? clickedTree.tileY : Math.floor(clickedTree.y / TILE_SIZE);
        this.triggerToolAction(txTarget, tyTarget);
        this.shakeTree(clickedTree.id);
        if (this.onChopTree) {
          this.onChopTree(clickedTree.id, txTarget, tyTarget);
        }
        return;
      } else {
        if (this.onShowToast) {
          this.onShowToast("Equipe o Machadinho de Ferro para cortar a árvore.", "info");
        }
        return;
      }
    }

    // Check if clicked on farmhouse door
    if ((tx === 17 || tx === 18) && (ty === 5 || ty === 6)) {
      if (this.onInteractDoor) {
        this.onInteractDoor();
        return;
      }
    }

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
    if (state.farm && state.farm.trees) {
      this.trees = state.farm.trees.map(t => ({
        id: t.id,
        x: t.x * TILE_SIZE,
        y: t.y * TILE_SIZE,
        tileX: t.x,
        tileY: t.y,
        health: t.health !== undefined ? t.health : 3,
        maxHealth: t.maxHealth !== undefined ? t.maxHealth : 3,
        isStump: !!t.isStump,
        type: 'maple'
      }));
    }
    if (state.player && state.player.position && !this.initialSync) {
      this.player.x = state.player.position.x * TILE_SIZE;
      this.player.y = state.player.position.y * TILE_SIZE;
      this.camera.x = this.player.x + 16;
      this.camera.y = this.player.y + 16;
      this.initialSync = true;
    }
  }

  shakeTree(treeId) {
    this.treeShakes[treeId] = 0.22;
  }

  setSelectedTool(tool) {
    this.selectedTool = tool;
  }

  triggerToolAction(targetTileX, targetTileY) {
    // Face the target tile
    const playerTileX = Math.floor((this.player.x + 16) / TILE_SIZE);
    const playerTileY = Math.floor((this.player.y + 24) / TILE_SIZE);
    const diffX = targetTileX - playerTileX;
    const diffY = targetTileY - playerTileY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      this.player.direction = diffX > 0 ? 'right' : 'left';
    } else if (Math.abs(diffY) > 0) {
      this.player.direction = diffY > 0 ? 'down' : 'up';
    }

    // Set punch/lunge timer (0.14 seconds)
    this.player.actionTimer = 0.14;
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

    // 5. Perimeter & Pasture Fences
    // Top border fence (except path gap)
    const topFence = { x: 7 * TILE_SIZE, y: 1 * TILE_SIZE, w: 6 * TILE_SIZE, h: 12 };
    if (intersects(box, topFence)) return true;

    // Pasture top fence: x=19 to 23 at y=1
    const pastureTopFence = { x: 19 * TILE_SIZE, y: 1 * TILE_SIZE, w: 4.5 * TILE_SIZE, h: 12 };
    if (intersects(box, pastureTopFence)) return true;

    // Pasture right fence: x=23, y=1 to 5
    const pastureRightFence = { x: 23 * TILE_SIZE, y: 1 * TILE_SIZE, w: 12, h: 4.5 * TILE_SIZE };
    if (intersects(box, pastureRightFence)) return true;

    // Pasture bottom fence: x=20 to 23 at y=5 (gate opening at x=19)
    const pastureBottomFence = { x: 20 * TILE_SIZE, y: 5 * TILE_SIZE, w: 3.5 * TILE_SIZE, h: 12 };
    if (intersects(box, pastureBottomFence)) return true;

    return false;
  }

  update(dt) {
    if (!this.gameState) return;

    // Pasture animals wandering & pecking AI
    for (const animal of this.animals) {
      animal.animTimer += dt;
      animal.stateTimer -= dt;

      if (animal.state === 'walk') {
        const dx = animal.targetX - animal.x;
        const dy = animal.targetY - animal.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2 || animal.stateTimer <= 0) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
          animal.state = Math.random() < 0.45 ? 'peck' : 'idle';
          animal.stateTimer = 1.5 + Math.random() * 2.5;
          animal.frame = 0;
        } else {
          const moveSpeed = animal.type === 'adult' ? 18 : 24;
          const step = Math.min(dist, moveSpeed * dt);
          animal.x += (dx / dist) * step;
          animal.y += (dy / dist) * step;
          animal.flipX = dx < 0;

          if (animal.animTimer >= 0.15) {
            animal.animTimer = 0;
            animal.frame = (animal.frame + 1) % 4;
          }
        }
      } else if (animal.state === 'peck') {
        if (animal.animTimer >= 0.22) {
          animal.animTimer = 0;
          animal.frame = (animal.frame + 1) % 4;
        }
        if (animal.stateTimer <= 0) {
          animal.state = 'idle';
          animal.stateTimer = 1.0 + Math.random() * 2.0;
        }
      } else { // idle
        if (animal.animTimer >= 0.4) {
          animal.animTimer = 0;
          animal.frame = (animal.frame + 1) % 2;
        }
        if (animal.stateTimer <= 0) {
          // Choose a new target within pasture [19.2 - 22.5] tiles X, [2.2 - 4.5] tiles Y
          const targetTileX = 19.3 + Math.random() * 3.2;
          const targetTileY = 2.2 + Math.random() * 2.4;
          animal.targetX = targetTileX * TILE_SIZE;
          animal.targetY = targetTileY * TILE_SIZE;
          animal.state = 'walk';
          animal.stateTimer = 2.5 + Math.random() * 2.0;
        }
      }
    }

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
        if (this.player.frame === 1 || this.player.frame === 4) {
          audio.playFootstep();
        }
      }
    } else {
      // Idle animation
      this.player.animTimer += dt;
      if (this.player.animTimer >= 0.25) {
        this.player.animTimer = 0;
        this.player.frame = (this.player.frame + 1) % 4;
      }
    }

    // Action lunge cooldown
    if (this.player.actionTimer > 0) {
      this.player.actionTimer = Math.max(0, this.player.actionTimer - dt);
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

    // Update tree shake animations
    for (const id in this.treeShakes) {
      this.treeShakes[id] -= dt;
      if (this.treeShakes[id] <= 0) {
        delete this.treeShakes[id];
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

    // 6. Draw Door Sleep Prompt
    this.renderDoorPrompt(ctx);

    // 7. Draw Ambient Day/Night Lighting and Lantern Glow
    this.renderLighting(ctx);

    // 8. Draw Floating Texts (on top for crisp readability)
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

    // Pasture top fence (y=1, from x=19 to x=23)
    for (let x = 19; x <= 23; x++) {
      ctx.drawImage(fenceImg, 0, 32, 16, 16, x * TILE_SIZE, 1 * TILE_SIZE, 16, 16);
    }

    // Pasture right fence (x=23, from y=2 to y=4)
    for (let y = 2; y <= 4; y++) {
      ctx.drawImage(fenceImg, 16, 32, 16, 16, 23 * TILE_SIZE, y * TILE_SIZE, 16, 16);
    }

    // Pasture bottom fence (y=5, from x=20 to x=23, leaves x=19 open as entrance gate)
    for (let x = 20; x <= 23; x++) {
      ctx.drawImage(fenceImg, 0, 32, 16, 16, x * TILE_SIZE, 5 * TILE_SIZE, 16, 16);
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

    // 3. Maple Trees & Stumps
    for (const tree of this.trees) {
      entities.push({
        sortY: tree.y + 44, // Base of trunk
        render: () => {
          const shakeRemaining = this.treeShakes[tree.id] || 0;
          const shakeOffset = shakeRemaining > 0 ? Math.sin(shakeRemaining * 45) * 3 : 0;

          // Soft oval shadow under tree or stump
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          if (tree.isStump) {
            ctx.ellipse(tree.x + 16, tree.y + 44, 9, 3.5, 0, 0, Math.PI * 2);
          } else {
            ctx.ellipse(tree.x + 16, tree.y + 44, 14, 5, 0, 0, Math.PI * 2);
          }
          ctx.fill();

          const treeImg = this.images.tree;
          if (treeImg) {
            const srcX = tree.isStump ? 128 : 96;
            ctx.drawImage(treeImg, srcX, 0, 32, 48, tree.x + shakeOffset, tree.y, 32, 48);
          }

          // If damaged, display subtle crack lines on trunk
          if (tree.health < (tree.maxHealth || 3)) {
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tree.x + 14 + shakeOffset, tree.y + 36);
            ctx.lineTo(tree.x + 17 + shakeOffset, tree.y + 41);
            ctx.stroke();
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

    // 5. Pasture Animals (Chickens and chicks)
    for (const animal of this.animals) {
      entities.push({
        sortY: animal.y + 14,
        render: () => {
          // Drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          const shadowRx = animal.type === 'adult' ? 6 : 4;
          const shadowRy = animal.type === 'adult' ? 2.5 : 2;
          ctx.ellipse(animal.x + 8, animal.y + 13, shadowRx, shadowRy, 0, 0, Math.PI * 2);
          ctx.fill();

          const img = animal.type === 'adult' ? this.images.chicken_adult : this.images.chicken;
          if (!img) return;

          // In chicken_adult (64x32), row 0 is 16x16 frames 0..3 (walk/peck)
          // In chicken baby (64x48), row 0 is 16x16 frames 0..3 (walk/peck)
          const srcX = (animal.frame % 4) * 16;
          const srcY = 0;

          ctx.save();
          if (animal.flipX) {
            ctx.translate(animal.x + 16, animal.y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, srcX, srcY, 16, 16, 0, 0, 16, 16);
          } else {
            ctx.drawImage(img, srcX, srcY, 16, 16, animal.x, animal.y, 16, 16);
          }
          ctx.restore();
        }
      });
    }

    // 6. Ground Eggs
    if (this.gameState.farm.eggs) {
      const babyChickenImg = this.images.chicken;
      for (const egg of this.gameState.farm.eggs) {
        entities.push({
          sortY: egg.y * TILE_SIZE + 12,
          render: () => {
            const eggScreenX = egg.x * TILE_SIZE;
            const eggScreenY = egg.y * TILE_SIZE;

            // Small drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(eggScreenX + 8, eggScreenY + 11, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Egg sprite from Baby Chicken Yellow.png row 2 (y=32, 16x16)
            if (babyChickenImg) {
              ctx.drawImage(babyChickenImg, 0, 32, 16, 16, eggScreenX, eggScreenY, 16, 16);
            }

            // Quality glow sparkle if silver or gold
            if (egg.quality && egg.quality !== 'normal') {
              const sparkleColor = egg.quality === 'gold' ? '#facc15' : '#e2e8f0';
              const pulse = Math.sin(Date.now() / 220) * 1.5;
              ctx.fillStyle = sparkleColor;
              ctx.beginPath();
              ctx.arc(eggScreenX + 11, eggScreenY + 4 + pulse, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }
    }

    // 7. Player Character
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

    let drawX = posX;
    let drawY = posY;

    // Action punch/lunge offset
    if (this.player.actionTimer > 0) {
      const progress = this.player.actionTimer / 0.14; // 1 down to 0
      const amount = Math.sin(progress * Math.PI) * 4;
      if (this.player.direction === 'down') drawY += amount;
      else if (this.player.direction === 'up') drawY -= amount;
      else if (this.player.direction === 'right') drawX += amount;
      else if (this.player.direction === 'left') drawX -= amount;
    }

    // Soft grounded drop shadow under character feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(posX + 16, posY + 28, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (flipX) {
      // Flip character horizontally
      ctx.translate(drawX + 32, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, 32, 32, 0, 0, 32, 32);
    } else {
      ctx.drawImage(img, srcX, srcY, 32, 32, drawX, drawY, 32, 32);
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

  renderDoorPrompt(ctx) {
    if (!this.gameState) return;
    // Farmhouse door position: x=17.5 * 16 = 280, y=5.5 * 16 = 88
    const doorX = this.house.x + 60;
    const doorY = this.house.y + 74;
    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;
    const dist = Math.hypot(doorX - playerCenterX, doorY - playerCenterY);

    this.isNearDoor = dist < 32;
    if (this.isNearDoor) {
      const bob = Math.sin(Date.now() / 250) * 2.5;
      ctx.font = '700 8px Rubik, sans-serif';
      ctx.textAlign = 'center';

      const promptText = "[E] Descansar";
      const metrics = ctx.measureText(promptText);
      const boxW = metrics.width + 10;
      const boxH = 13;
      const boxX = doorX - boxW / 2;
      const boxY = doorY - 26 + bob;

      // Drop shadow and background pill
      ctx.fillStyle = '#543118';
      ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = '#f7e6c4';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Text
      ctx.fillStyle = '#3b220c';
      ctx.fillText(promptText, doorX, boxY + 9);
    }
  }

  renderLighting(ctx) {
    if (!this.gameState || !this.gameState.time) return;
    const hour = this.gameState.time.hour !== undefined ? this.gameState.time.hour : 6;
    const minute = this.gameState.time.minute !== undefined ? this.gameState.time.minute : 0;
    const totalMinutes = hour * 60 + minute;

    let ambientColor = null;
    let alpha = 0;
    let isNight = false;

    if (totalMinutes >= 330 && totalMinutes < 480) {
      // Dawn (05:30 - 08:00): Soft morning rose/gold
      const t = (totalMinutes - 330) / 150;
      ambientColor = '255, 175, 70';
      alpha = 0.22 * (1 - t);
    } else if (totalMinutes >= 480 && totalMinutes < 1020) {
      // Daylight (08:00 - 17:00): Clear and crisp
      alpha = 0;
    } else if (totalMinutes >= 1020 && totalMinutes < 1200) {
      // Sunset / Golden Hour (17:00 - 20:00): Warm amber
      const t = (totalMinutes - 1020) / 180;
      ambientColor = '240, 115, 25';
      alpha = 0.28 * t;
    } else {
      // Night (20:00 - 05:30): Midnight navy blue
      ambientColor = '12, 18, 52';
      alpha = 0.58;
      isNight = true;
    }

    if (alpha > 0.02) {
      const worldW = this.gameState.farm.width * TILE_SIZE;
      const worldH = this.gameState.farm.height * TILE_SIZE;

      ctx.save();
      // Draw ambient day/night overlay
      ctx.fillStyle = `rgba(${ambientColor}, ${alpha})`;
      ctx.fillRect(0, 0, worldW, worldH);

      // In dusk or night, draw glowing warm lantern light from house windows and player
      if (isNight || alpha > 0.2) {
        ctx.globalCompositeOperation = 'destination-out';

        // 1. Lantern around player
        const playerX = this.player.x + 16;
        const playerY = this.player.y + 16;
        const playerGrad = ctx.createRadialGradient(playerX, playerY, 4, playerX, playerY, 52);
        playerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        playerGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
        playerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = playerGrad;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 52, 0, Math.PI * 2);
        ctx.fill();

        // 2. Warm light through house windows and door
        const houseLightX = this.house.x + 40;
        const houseLightY = this.house.y + 65;
        const houseGrad = ctx.createRadialGradient(houseLightX, houseLightY, 6, houseLightX, houseLightY, 70);
        houseGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        houseGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
        houseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = houseGrad;
        ctx.beginPath();
        ctx.arc(houseLightX, houseLightY, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Cozy warm golden highlights on the windows and door
        ctx.fillStyle = 'rgba(255, 220, 90, 0.4)';
        ctx.fillRect(this.house.x + 22, this.house.y + 54, 14, 14); // lower window
        ctx.fillRect(this.house.x + 44, this.house.y + 36, 12, 12); // upper window
        ctx.fillRect(this.house.x + 58, this.house.y + 64, 12, 18); // doorway
      } else {
        ctx.restore();
      }
    }
  }
}
