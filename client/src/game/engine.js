import { audio } from './audio';

// 2D Game Engine for FZN Farm — Refined with Collisions, Y-Sorting & World Composition
const TILE_SIZE = 16;
const ZOOM = 3; // 16 * 3 = 48px on screen

export class GameEngine {
  constructor(canvas, onTileInteract, onShowToast, onInteractDoor, onCollectEgg, onChopTree, onMilkCow, onPetAnimal, onTransitionLocation, onOpenChest, onTuneRadio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onTileInteract = onTileInteract;
    this.onShowToast = onShowToast;
    this.onInteractDoor = onInteractDoor;
    this.onCollectEgg = onCollectEgg;
    this.onChopTree = onChopTree;
    this.onMilkCow = onMilkCow;
    this.onPetAnimal = onPetAnimal;
    this.onTransitionLocation = onTransitionLocation;
    this.onOpenChest = onOpenChest;
    this.onTuneRadio = onTuneRadio;
    this.location = 'farm'; // 'farm' | 'house_interior'
    this.isNearDoor = false;
    this.isNearBed = false;
    this.isNearInteriorExit = false;
    this.isNearChest = false;
    this.isNearRadio = false;
    this.isChestOpen = false;
    this.isTransitioning = false;
    this.treeShakes = {};
    this.interiorEmbers = [];

    // Weather & Atmospheric Particles
    this.rainParticles = [];
    this.rainRipples = [];
    this.lightningTimer = 10;
    this.lightningFlashAlpha = 0;

    // Pre-populate 130 rain particles across farm bounds
    const worldW = 24 * TILE_SIZE;
    const worldH = 18 * TILE_SIZE;
    for (let i = 0; i < 130; i++) {
      this.rainParticles.push({
        x: Math.random() * (worldW + 80) - 40,
        y: Math.random() * (worldH + 80) - 40,
        len: Math.random() * 6 + 7,
        speed: Math.random() * 80 + 380
      });
    }

    // Pasture animals (Chickens, chicks, and dairy cattle)
    this.animals = [
      { id: 'chicken_1', type: 'adult', name: 'Gertrudes', x: 20 * TILE_SIZE, y: 3 * TILE_SIZE, targetX: 20 * TILE_SIZE, targetY: 3 * TILE_SIZE, state: 'idle', stateTimer: 2, frame: 0, animTimer: 0, flipX: false, bounds: { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 } },
      { id: 'chicken_red_1', type: 'red_chicken', name: 'Penélope', x: 22 * TILE_SIZE, y: 3 * TILE_SIZE, targetX: 22 * TILE_SIZE, targetY: 3 * TILE_SIZE, state: 'idle', stateTimer: 2.5, frame: 0, animTimer: 0, flipX: false, bounds: { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 } },
      { id: 'chick_1', type: 'chick', name: 'Piu-Piu', x: 19 * TILE_SIZE, y: 4 * TILE_SIZE, targetX: 19 * TILE_SIZE, targetY: 4 * TILE_SIZE, state: 'idle', stateTimer: 1.5, frame: 0, animTimer: 0, flipX: false, bounds: { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 } },
      { id: 'chick_2', type: 'chick', name: 'Amarelinho', x: 21 * TILE_SIZE, y: 4 * TILE_SIZE, targetX: 21 * TILE_SIZE, targetY: 4 * TILE_SIZE, state: 'idle', stateTimer: 2.2, frame: 0, animTimer: 0, flipX: true, bounds: { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 } },
      { id: 'cow_1', type: 'female_cow', name: 'Mimosa', x: 19 * TILE_SIZE, y: 9 * TILE_SIZE, targetX: 19 * TILE_SIZE, targetY: 9 * TILE_SIZE, state: 'idle', stateTimer: 3, frame: 0, animTimer: 0, flipX: false, lastMilkedDay: 0, bounds: { minX: 18.2, maxX: 22.5, minY: 8.5, maxY: 11.5 } },
      { id: 'cow_2', type: 'male_cow', name: 'Ferdinando', x: 21 * TILE_SIZE, y: 10 * TILE_SIZE, targetX: 21 * TILE_SIZE, targetY: 10 * TILE_SIZE, state: 'idle', stateTimer: 3.5, frame: 0, animTimer: 0, flipX: true, bounds: { minX: 18.2, maxX: 22.5, minY: 8.5, maxY: 11.5 } }
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
      { key: 'chicken_adult', url: '/assets/Farm%20Animals/Chicken%20Blonde%20%20Green.png' },
      { key: 'chicken_red', url: '/assets/Farm%20Animals/Chicken%20Red.png' },
      { key: 'cow_female', url: '/assets/Farm%20Animals/Female%20Cow%20Brown.png' },
      { key: 'cow_male', url: '/assets/Farm%20Animals/Male%20Cow%20Brown.png' },
      { key: 'interior', url: '/assets/Objects/Interior.png' }
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
    audio.stopRain();
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === 'KeyE') {
      if (this.location === 'farm') {
        if (this.isNearChest) {
          if (this.onOpenChest) this.onOpenChest();
        } else if (this.isNearDoor) {
          this.transitionToLocation('house_interior');
        }
      } else if (this.location === 'house_interior') {
        if (this.isNearRadio) {
          if (this.onTuneRadio) {
            this.onTuneRadio();
          }
        } else if (this.isNearBed) {
          if (this.onInteractDoor) {
            this.onInteractDoor();
          }
        } else if (this.isNearInteriorExit) {
          this.transitionToLocation('farm');
        }
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

    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;

    // Interior interactions
    if (this.location === 'house_interior') {
      // 1. Radio Weather Station click interaction (x: 52 to 74, y: 8 to 32)
      if (this.mouse.worldX >= 52 && this.mouse.worldX <= 74 && this.mouse.worldY >= 8 && this.mouse.worldY <= 32) {
        const dist = Math.hypot(62 - playerCenterX, 32 - playerCenterY);
        if (dist <= 38) {
          if (this.onTuneRadio) this.onTuneRadio();
        } else if (this.onShowToast) {
          this.onShowToast("Aproxime-se do rádio para sintonizar a previsão do tempo.", "info");
        }
        return;
      }

      // 2. Bed click interaction (x: 20 to 46, y: 30 to 70)
      if (this.mouse.worldX >= 20 && this.mouse.worldX <= 46 && this.mouse.worldY >= 30 && this.mouse.worldY <= 70) {
        const dist = Math.hypot(33 - playerCenterX, 50 - playerCenterY);
        if (dist <= 38) {
          if (this.onInteractDoor) this.onInteractDoor();
        } else if (this.onShowToast) {
          this.onShowToast("Aproxime-se da cama para descansar.", "info");
        }
        return;
      }

      // 3. Doorway exit click interaction (x: 84 to 108, y: 120 to 140)
      if (this.mouse.worldX >= 84 && this.mouse.worldX <= 108 && this.mouse.worldY >= 120 && this.mouse.worldY <= 140) {
        const dist = Math.hypot(96 - playerCenterX, 126 - playerCenterY);
        if (dist <= 36) {
          this.transitionToLocation('farm');
        } else if (this.onShowToast) {
          this.onShowToast("Aproxime-se da porta para sair.", "info");
        }
        return;
      }

      // 4. Fireplace warm crackle interaction (x: 138 to 168, y: 24 to 68)
      if (this.mouse.worldX >= 138 && this.mouse.worldX <= 168 && this.mouse.worldY >= 24 && this.mouse.worldY <= 68) {
        const dist = Math.hypot(153 - playerCenterX, 52 - playerCenterY);
        if (dist <= 48) {
          audio.playFireplaceCrackle();
          this.addFloatingText("🔥 Lareira quentinha", 153, 30, '#f97316');
          this.addParticleBurst(153, 52, '#f97316', 8);
        } else if (this.onShowToast) {
          this.onShowToast("Aproxime-se da lareira para se aquecer.", "info");
        }
        return;
      }

      return;
    }

    const tx = this.mouse.tileX;
    const ty = this.mouse.tileY;

    // Check bounds
    if (tx < 0 || tx >= this.gameState.farm.width || ty < 0 || ty >= this.gameState.farm.height) {
      return;
    }

    // Check if clicked on storage chest (x: 13, y: 5)
    if (this.mouse.worldX >= this.chest.x - 2 && this.mouse.worldX <= this.chest.x + 18 &&
        this.mouse.worldY >= this.chest.y - 2 && this.mouse.worldY <= this.chest.y + 18) {
      const dist = Math.hypot(this.chest.x + 8 - playerCenterX, this.chest.y + 8 - playerCenterY);
      if (dist <= 42) {
        if (this.onOpenChest) this.onOpenChest();
      } else if (this.onShowToast) {
        this.onShowToast("Muito longe do baú! Aproxime-se.", "warning");
      }
      return;
    }

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

    // Check if clicked on an animal (milking or petting interaction)
    const clickedAnimal = this.animals.find(animal => {
      const isCow = animal.type === 'female_cow' || animal.type === 'male_cow';
      const hitboxRadius = isCow ? 18 : 14;
      const animalCenterX = animal.x + (isCow ? 16 : 8);
      const animalCenterY = animal.y + (isCow ? 16 : 8);
      return Math.hypot(animalCenterX - this.mouse.worldX, animalCenterY - this.mouse.worldY) < hitboxRadius;
    });

    if (clickedAnimal) {
      const isCow = clickedAnimal.type === 'female_cow' || clickedAnimal.type === 'male_cow';
      const animalCenterX = clickedAnimal.x + (isCow ? 16 : 8);
      const animalCenterY = clickedAnimal.y + (isCow ? 16 : 8);
      const dist = Math.hypot(animalCenterX - playerCenterX, animalCenterY - playerCenterY) / TILE_SIZE;

      if (dist <= 3.5) {
        if (this.selectedTool && this.selectedTool.id === 'tool_pail') {
          // Milking action
          const cowTileX = Math.floor(animalCenterX / TILE_SIZE);
          const cowTileY = Math.floor(animalCenterY / TILE_SIZE);
          this.triggerToolAction(cowTileX, cowTileY);
          if (this.onMilkCow) {
            this.onMilkCow(clickedAnimal.id, cowTileX, cowTileY);
          }
          return;
        } else {
          // Petting action
          if (isCow) {
            audio.playMoo();
          } else if (clickedAnimal.type === 'adult') {
            audio.playCluck();
          } else {
            audio.playChirp();
          }
          this.addFloatingText("❤️", animalCenterX, clickedAnimal.y - 4, '#ff6b81');
          this.addParticleBurst(animalCenterX, animalCenterY, '#f472b6', 7);
          if (this.onPetAnimal) {
            this.onPetAnimal(clickedAnimal.id);
          }
          return;
        }
      } else {
        if (this.onShowToast) {
          this.onShowToast(`Muito longe para interagir com ${clickedAnimal.name || 'o animal'}. Aproxime-se!`, "warning");
        }
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
      this.transitionToLocation('house_interior');
      return;
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
    if (state.farm && state.farm.animals) {
      state.farm.animals.forEach(serverAnimal => {
        let local = this.animals.find(a => a.id === serverAnimal.id);
        const isCow = serverAnimal.type === 'female_cow' || serverAnimal.type === 'male_cow';
        if (!local) {
          local = {
            id: serverAnimal.id,
            type: serverAnimal.type,
            name: serverAnimal.name,
            x: serverAnimal.x * TILE_SIZE,
            y: serverAnimal.y * TILE_SIZE,
            targetX: serverAnimal.x * TILE_SIZE,
            targetY: serverAnimal.y * TILE_SIZE,
            state: 'idle',
            stateTimer: 2,
            frame: 0,
            animTimer: 0,
            flipX: false,
            bounds: isCow ? { minX: 18.2, maxX: 22.5, minY: 8.5, maxY: 11.5 } : { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 }
          };
          this.animals.push(local);
        }
        local.lastMilkedDay = serverAnimal.lastMilkedDay;
        local.affection = serverAnimal.affection;
      });
    }
    if (state.player && !this.initialSync) {
      if (state.player.location) {
        this.location = state.player.location;
      }
      if (state.player.position) {
        this.player.x = state.player.position.x * TILE_SIZE;
        this.player.y = state.player.position.y * TILE_SIZE;
      }
      if (this.location === 'house_interior') {
        this.camera.x = 96;
        this.camera.y = 72;
      } else {
        this.camera.x = this.player.x + 16;
        this.camera.y = this.player.y + 16;
      }
      this.initialSync = true;
    }

    // Weather sound synchronization
    const isRaining = state.weather === 'rainy' || state.weather === 'stormy';
    if (isRaining) {
      if (!audio.isRaining) {
        audio.startRain(this.location === 'house_interior');
      } else {
        audio.updateRainIndoors(this.location === 'house_interior');
      }
    } else if (audio.isRaining) {
      audio.stopRain();
    }
  }

  transitionToLocation(targetLocation) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    if (this.onTransitionLocation) {
      this.onTransitionLocation(targetLocation);
    }
  }

  setLocation(newLocation, px, py, dir = 'down') {
    this.location = newLocation;
    this.player.x = px;
    this.player.y = py;
    this.player.direction = dir;
    this.player.isMoving = false;
    this.isNearDoor = false;
    this.isNearBed = false;
    this.isNearInteriorExit = false;
    this.isNearRadio = false;
    this.isTransitioning = false;

    if (newLocation === 'house_interior') {
      this.camera.x = 96;
      this.camera.y = 72;
    } else {
      this.camera.x = this.player.x + 16;
      this.camera.y = this.player.y + 16;
    }

    // Adjust rain sound muffling for current room
    if (this.gameState && (this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy')) {
      audio.updateRainIndoors(newLocation === 'house_interior');
    }
  }

  setChestOpen(isOpen) {
    this.isChestOpen = !!isOpen;
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

    // Helper for AABB collision
    const intersects = (a, b) => {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    };

    if (this.location === 'house_interior') {
      // Room perimeter walls
      if (box.x < 16) return true;
      if (box.x + box.w > 176) return true;
      if (box.y < 38) return true;

      // Bottom wall (doorway is at x: 86 to 106)
      const inDoorway = box.x >= 86 && (box.x + box.w) <= 106;
      if (!inDoorway && (box.y + box.h > 130)) {
        return true;
      }

      // Exit doorway threshold trigger
      if (inDoorway && (box.y + box.h >= 134)) {
        this.transitionToLocation('farm');
        return true;
      }

      // Furniture collisions:
      // 1. Bed (x: 24, y: 36, w: 18, h: 30)
      if (intersects(box, { x: 24, y: 36, w: 18, h: 30 })) return true;

      // 2. Nightstand (x: 44, y: 36, w: 16, h: 16)
      if (intersects(box, { x: 44, y: 36, w: 16, h: 16 })) return true;

      // 3. Dining Table (x: 84, y: 72, w: 24, h: 18)
      if (intersects(box, { x: 84, y: 72, w: 24, h: 18 })) return true;

      // 4. Brick Fireplace (x: 140, y: 36, w: 26, h: 28)
      if (intersects(box, { x: 140, y: 36, w: 26, h: 28 })) return true;

      return false;
    }

    // 1. World map bounds (leaving 1 tile border for natural trees/fences)
    const minWorldX = 0.5 * TILE_SIZE;
    const maxWorldX = (this.gameState.farm.width - 1.5) * TILE_SIZE;
    const minWorldY = 0.5 * TILE_SIZE;
    const maxWorldY = (this.gameState.farm.height - 1.5) * TILE_SIZE;

    if (box.x < minWorldX || (box.x + box.w) > maxWorldX ||
        box.y < minWorldY || (box.y + box.h) > maxWorldY) {
      return true;
    }

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

    // Cattle pasture fences (south-east meadow)
    const cattleTopFence = { x: 19 * TILE_SIZE, y: 8 * TILE_SIZE, w: 4.5 * TILE_SIZE, h: 12 };
    if (intersects(box, cattleTopFence)) return true;

    const cattleRightFence = { x: 23 * TILE_SIZE, y: 8 * TILE_SIZE, w: 12, h: 4.5 * TILE_SIZE };
    if (intersects(box, cattleRightFence)) return true;

    const cattleBottomFence = { x: 19 * TILE_SIZE, y: 12 * TILE_SIZE, w: 4.5 * TILE_SIZE, h: 12 };
    if (intersects(box, cattleBottomFence)) return true;

    const cattleLeftFence = { x: 18 * TILE_SIZE, y: 9 * TILE_SIZE, w: 12, h: 3.2 * TILE_SIZE };
    if (intersects(box, cattleLeftFence)) return true;

    return false;
  }

  update(dt) {
    if (!this.gameState) return;

    // Pasture animals wandering & pecking AI (outdoors only)
    if (this.location === 'farm') {
      for (const animal of this.animals) {
      animal.animTimer += dt;
      animal.stateTimer -= dt;

      const isCow = animal.type === 'female_cow' || animal.type === 'male_cow';
      const b = animal.bounds || (isCow ? { minX: 18.2, maxX: 22.5, minY: 8.5, maxY: 11.5 } : { minX: 19.2, maxX: 22.8, minY: 2.2, maxY: 4.8 });

      if (animal.state === 'walk') {
        const dx = animal.targetX - animal.x;
        const dy = animal.targetY - animal.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2 || animal.stateTimer <= 0) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
          animal.state = isCow ? (Math.random() < 0.45 ? 'graze' : 'idle') : (Math.random() < 0.45 ? 'peck' : 'idle');
          animal.stateTimer = 1.5 + Math.random() * 2.5;
          animal.frame = 0;
        } else {
          const moveSpeed = isCow ? 12 : (animal.type === 'adult' ? 18 : 24);
          const step = Math.min(dist, moveSpeed * dt);
          animal.x += (dx / dist) * step;
          animal.y += (dy / dist) * step;
          animal.flipX = dx < 0;

          if (isCow) {
            animal.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          }

          const animSpeed = isCow ? 0.22 : 0.15;
          if (animal.animTimer >= animSpeed) {
            animal.animTimer = 0;
            animal.frame = (animal.frame + 1) % 4;
          }
        }
      } else if (animal.state === 'peck' || animal.state === 'graze') {
        const grazeSpeed = isCow ? 0.35 : 0.22;
        if (animal.animTimer >= grazeSpeed) {
          animal.animTimer = 0;
          animal.frame = (animal.frame + 1) % 4;
        }
        if (animal.stateTimer <= 0) {
          animal.state = 'idle';
          animal.stateTimer = 1.2 + Math.random() * 2.2;
        }
      } else { // idle
        const idleSpeed = isCow ? 0.6 : 0.4;
        if (animal.animTimer >= idleSpeed) {
          animal.animTimer = 0;
          animal.frame = (animal.frame + 1) % 2;
        }
        if (animal.stateTimer <= 0) {
          const targetTileX = b.minX + Math.random() * (b.maxX - b.minX);
          const targetTileY = b.minY + Math.random() * (b.maxY - b.minY);
          animal.targetX = targetTileX * TILE_SIZE;
          animal.targetY = targetTileY * TILE_SIZE;
          animal.state = 'walk';
          animal.stateTimer = 3.0 + Math.random() * 2.5;
        }
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

    if (this.location === 'house_interior') {
      // Camera locks smoothly to center of interior room
      const targetCamX = 96;
      const targetCamY = 72;
      this.camera.x += (targetCamX - this.camera.x) * (dt * 10);
      this.camera.y += (targetCamY - this.camera.y) * (dt * 10);

      // Spawn and update interior embers from fireplace
      if (Math.random() < 0.35) {
        this.interiorEmbers.push({
          x: 149 + Math.random() * 8,
          y: 49,
          vx: (Math.random() - 0.5) * 8,
          vy: -14 - Math.random() * 18,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
          color: Math.random() < 0.65 ? '#f97316' : '#facc15'
        });
      }
      for (let i = this.interiorEmbers.length - 1; i >= 0; i--) {
        const emb = this.interiorEmbers[i];
        emb.life -= dt;
        emb.x += emb.vx * dt;
        emb.y += emb.vy * dt;
        if (emb.life <= 0) {
          this.interiorEmbers.splice(i, 1);
        }
      }

      // Proximity checks inside
      const playerCenterX = this.player.x + 16;
      const playerCenterY = this.player.y + 24;
      this.isNearBed = Math.hypot(33 - playerCenterX, 50 - playerCenterY) < 32;
      this.isNearInteriorExit = Math.hypot(96 - playerCenterX, 126 - playerCenterY) < 24;
      this.isNearRadio = Math.hypot(62 - playerCenterX, 32 - playerCenterY) < 28;
    } else {
      // Outdoor farm camera & clamping
      const targetCamX = this.player.x + 16;
      const targetCamY = this.player.y + 16;
      this.camera.x += (targetCamX - this.camera.x) * (dt * 7);
      this.camera.y += (targetCamY - this.camera.y) * (dt * 7);

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

      // Outdoor door proximity
      const doorX = this.house.x + 60;
      const doorY = this.house.y + 74;
      const playerCenterX = this.player.x + 16;
      const playerCenterY = this.player.y + 24;
      this.isNearDoor = Math.hypot(doorX - playerCenterX, doorY - playerCenterY) < 32;

      // Outdoor chest proximity
      const chestCenterX = this.chest.x + 8;
      const chestCenterY = this.chest.y + 8;
      this.isNearChest = Math.hypot(chestCenterX - playerCenterX, chestCenterY - playerCenterY) < 32;
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

    // Update weather & rain simulation
    const isRaining = this.gameState && (this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy');
    const isStormy = this.gameState && this.gameState.weather === 'stormy';

    if (isRaining) {
      const worldW = (this.gameState?.farm?.width || 24) * TILE_SIZE;
      const worldH = (this.gameState?.farm?.height || 18) * TILE_SIZE;

      for (const drop of this.rainParticles) {
        drop.y += drop.speed * dt;
        drop.x += (drop.speed * 0.18) * dt;

        if (drop.y > worldH + 20 || drop.x > worldW + 40) {
          // Reset to top or left edge
          if (Math.random() < 0.25) {
            drop.x = -20;
            drop.y = Math.random() * worldH;
          } else {
            drop.x = Math.random() * (worldW + 60) - 20;
            drop.y = -20;
          }

          // Spawn ground ripple on splash
          if (this.location === 'farm' && Math.random() < 0.45) {
            this.rainRipples.push({
              x: Math.min(worldW, Math.max(0, drop.x)),
              y: Math.min(worldH, Math.max(0, drop.y + 15)),
              r: 1,
              maxR: Math.random() * 2.5 + 2,
              alpha: 0.55
            });
          }
        }
      }

      // Update ripples
      for (let i = this.rainRipples.length - 1; i >= 0; i--) {
        const rip = this.rainRipples[i];
        rip.r += 12 * dt;
        rip.alpha -= 3.5 * dt;
        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          this.rainRipples.splice(i, 1);
        }
      }

      // Storm lightning & thunder
      if (isStormy) {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          this.lightningTimer = Math.random() * 18 + 14; // Every 14 to 32 seconds
          this.lightningFlashAlpha = 0.65;
          audio.playThunder();
        }
      }
    }

    if (this.lightningFlashAlpha > 0) {
      this.lightningFlashAlpha = Math.max(0, this.lightningFlashAlpha - 5.5 * dt);
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background
    if (this.location === 'house_interior') {
      ctx.fillStyle = '#0a0d14'; // Dark ambient diorama frame for cozy room
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#1e3819';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    // Center camera
    ctx.translate(width / 2, height / 2);
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Turn off smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    if (this.location === 'house_interior') {
      this.renderHouseInterior(ctx);
    } else {
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

      // 6.1 Draw Chest Prompt
      this.renderChestPrompt(ctx);

      // 6.2 Draw Rain Particles & Ground Ripples
      this.renderRain(ctx);

      // 7. Draw Ambient Day/Night Lighting and Lantern Glow
      this.renderLighting(ctx);
    }

    // 8. Draw Floating Texts (on top for crisp readability)
    this.renderFloatingTexts(ctx);

    // 9. Lightning Flash Overlay
    this.renderLightningFlash(ctx);

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

    // Cattle pasture top fence (y=8, from x=19 to x=23)
    for (let x = 19; x <= 23; x++) {
      ctx.drawImage(fenceImg, 0, 32, 16, 16, x * TILE_SIZE, 8 * TILE_SIZE, 16, 16);
    }

    // Cattle pasture right fence (x=23, from y=9 to y=11)
    for (let y = 9; y <= 11; y++) {
      ctx.drawImage(fenceImg, 16, 32, 16, 16, 23 * TILE_SIZE, y * TILE_SIZE, 16, 16);
    }

    // Cattle pasture bottom fence (y=12, from x=19 to x=23)
    for (let x = 19; x <= 23; x++) {
      ctx.drawImage(fenceImg, 0, 32, 16, 16, x * TILE_SIZE, 12 * TILE_SIZE, 16, 16);
    }

    // Cattle pasture left fence (x=18, from y=10 to y=12, leaves y=9 open as gate)
    for (let y = 10; y <= 12; y++) {
      ctx.drawImage(fenceImg, 16, 32, 16, 16, 18 * TILE_SIZE, y * TILE_SIZE, 16, 16);
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
          const sy = this.isChestOpen ? 16 : 0;
          ctx.drawImage(chestImg, 8, sy, 16, 16, this.chest.x, this.chest.y, 16, 16);
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

    // 5. Pasture Animals (Chickens, chicks, and dairy cattle)
    for (const animal of this.animals) {
      const isCow = animal.type === 'female_cow' || animal.type === 'male_cow';
      const sortY = animal.y + (isCow ? 28 : 14);

      entities.push({
        sortY,
        render: () => {
          // Drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          if (isCow) {
            ctx.ellipse(animal.x + 16, animal.y + 26, 12, 4.5, 0, 0, Math.PI * 2);
          } else {
            const shadowRx = animal.type === 'adult' ? 6 : 4;
            const shadowRy = animal.type === 'adult' ? 2.5 : 2;
            ctx.ellipse(animal.x + 8, animal.y + 13, shadowRx, shadowRy, 0, 0, Math.PI * 2);
          }
          ctx.fill();

          if (isCow) {
            const img = animal.type === 'female_cow' ? this.images.cow_female : this.images.cow_male;
            if (!img) return;

            let row = 0; // Down
            if (animal.direction === 'up') row = 1;
            else if (animal.direction === 'right' || animal.direction === 'left') row = 2;

            const frame = animal.frame % 4;
            const srcX = frame * 32;
            const srcY = row * 32;

            ctx.save();
            if (animal.flipX) {
              ctx.translate(animal.x + 32, animal.y);
              ctx.scale(-1, 1);
              ctx.drawImage(img, srcX, srcY, 32, 32, 0, 0, 32, 32);
            } else {
              ctx.drawImage(img, srcX, srcY, 32, 32, animal.x, animal.y, 32, 32);
            }
            ctx.restore();

            // Ready to milk bubble indicator
            const currentDay = this.gameState?.time?.day || 1;
            if (animal.type === 'female_cow' && animal.lastMilkedDay !== currentDay) {
              const bob = Math.sin(Date.now() / 240) * 2;
              ctx.font = '8px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.beginPath();
              ctx.arc(animal.x + 16, animal.y - 6 + bob, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.fillText('🥛', animal.x + 16, animal.y - 3 + bob);
            }
          } else {
            // Chickens & chicks
            const img = animal.type === 'red_chicken' ? this.images.chicken_red : (animal.type === 'adult' ? this.images.chicken_adult : this.images.chicken);
            if (!img) return;

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

      const promptText = "[E] Entrar na Casa";
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

  renderChestPrompt(ctx) {
    if (!this.gameState || this.location === 'house_interior' || this.isChestOpen) return;
    const chestCenterX = this.chest.x + 8;
    const chestCenterY = this.chest.y + 8;
    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;
    const dist = Math.hypot(chestCenterX - playerCenterX, chestCenterY - playerCenterY);

    this.isNearChest = dist < 32;
    if (this.isNearChest) {
      const bob = Math.sin(Date.now() / 250) * 2.5;
      ctx.font = '700 8px Rubik, sans-serif';
      ctx.textAlign = 'center';

      const promptText = "[E] Abrir Baú";
      const metrics = ctx.measureText(promptText);
      const boxW = metrics.width + 10;
      const boxH = 13;
      const boxX = chestCenterX - boxW / 2;
      const boxY = this.chest.y - 18 + bob;

      // Drop shadow and background pill
      ctx.fillStyle = '#543118';
      ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = '#f7e6c4';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Text
      ctx.fillStyle = '#3b220c';
      ctx.fillText(promptText, chestCenterX, boxY + 9);
    }
  }

  renderRain(ctx) {
    if (!this.gameState) return;
    const isRaining = this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy';
    if (!isRaining) return;

    // 1. Draw water splash ripples on the ground
    for (const rip of this.rainRipples) {
      ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.r * 1.6, rip.r * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw falling rain streaks
    ctx.strokeStyle = 'rgba(215, 235, 255, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const drop of this.rainParticles) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.len * 0.18, drop.y + drop.len);
    }
    ctx.stroke();
  }

  renderLightningFlash(ctx) {
    if (this.lightningFlashAlpha <= 0.01) return;
    const worldW = (this.gameState?.farm?.width || 24) * TILE_SIZE;
    const worldH = (this.gameState?.farm?.height || 18) * TILE_SIZE;
    ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlashAlpha})`;
    if (this.location === 'house_interior') {
      ctx.fillRect(0, 0, 192, 144);
    } else {
      ctx.fillRect(-60, -60, worldW + 120, worldH + 120);
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

    // Overcast rainy tint during daylight
    const isRaining = this.gameState && (this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy');
    const isStormy = this.gameState && this.gameState.weather === 'stormy';
    if (isRaining && !isNight) {
      ambientColor = isStormy ? '26, 38, 58' : '38, 54, 72';
      alpha = Math.max(alpha, isStormy ? 0.36 : 0.22);
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

  // --- Farmhouse Interior Rendering System ---

  renderHouseInterior(ctx) {
    const interior = this.images.interior;
    if (!interior) return;

    // 1. Room Floor Planks (x: 16 to 176, y: 38 to 134)
    // Warm rich oak wooden planks with subtle texture
    ctx.fillStyle = '#c5925b';
    ctx.fillRect(16, 38, 160, 94);

    // Plank seam lines
    ctx.fillStyle = '#9e6d3a';
    for (let py = 48; py <= 130; py += 10) {
      ctx.fillRect(16, py, 160, 1);
    }

    // Staggered vertical seams
    ctx.fillStyle = '#b5804c';
    for (let py = 38; py < 130; py += 10) {
      const offset = ((py - 38) / 10) % 2 === 0 ? 0 : 20;
      for (let px = 16 + offset; px < 176; px += 40) {
        ctx.fillRect(px, py, 1, 9);
      }
    }

    // 2. Entrance Threshold & Doormat (doorway x: 86 to 106, y: 122 to 134)
    ctx.fillStyle = '#78350f'; // dark timber frame
    ctx.fillRect(86, 122, 20, 12);
    ctx.fillStyle = '#d97706'; // cozy golden-brown welcome mat
    ctx.fillRect(88, 124, 16, 8);
    // Mat striped woven detail
    ctx.fillStyle = '#b45309';
    ctx.fillRect(89, 126, 14, 1);
    ctx.fillRect(89, 129, 14, 1);

    // 3. Walls
    // Back wall: horizontal cream wood siding paneling (x: 16 to 176, y: 0 to 38)
    ctx.fillStyle = '#e5cca8';
    ctx.fillRect(16, 0, 160, 38);

    // Panel stripes
    ctx.fillStyle = '#bfa17c';
    for (let wy = 8; wy <= 36; wy += 8) {
      ctx.fillRect(16, wy, 160, 1);
    }

    // Ceiling beam / crown molding (y: 0 to 6)
    ctx.fillStyle = '#543118';
    ctx.fillRect(16, 0, 160, 6);
    ctx.fillStyle = '#7c4a24';
    ctx.fillRect(16, 4, 160, 2);

    // Floor baseboard (y: 34 to 38)
    ctx.fillStyle = '#543118';
    ctx.fillRect(16, 34, 160, 4);

    // Side walls: vertical timber pillar beams
    // Left wall: x: 10 to 16, y: 0 to 134
    ctx.fillStyle = '#543118';
    ctx.fillRect(10, 0, 6, 134);
    ctx.fillStyle = '#7c4a24';
    ctx.fillRect(13, 0, 3, 134);

    // Right wall: x: 176 to 182, y: 0 to 134
    ctx.fillStyle = '#543118';
    ctx.fillRect(176, 0, 6, 134);
    ctx.fillStyle = '#7c4a24';
    ctx.fillRect(176, 0, 3, 134);

    // Bottom wall partitions (leaving door opening at x: 86 to 106)
    ctx.fillStyle = '#543118';
    ctx.fillRect(10, 130, 76, 6);
    ctx.fillRect(106, 130, 76, 6);
    ctx.fillStyle = '#7c4a24';
    ctx.fillRect(10, 130, 76, 2);
    ctx.fillRect(106, 130, 76, 2);

    // 4. Back Wall Decor (always behind entities)
    // Wall painting 1 (Botanical red flowers): sx: 18, sy: 1, sw: 12, sh: 15
    ctx.drawImage(interior, 18, 1, 12, 15, 34, 12, 12, 15);

    // Wall clock: sx: 1, sy: 18, sw: 13, sh: 13
    ctx.drawImage(interior, 1, 18, 13, 13, 62, 14, 13, 13);

    // Picture frame 2 (Sunrise over hills): sx: 18, sy: 18, sw: 13, sh: 13
    ctx.drawImage(interior, 18, 18, 13, 13, 86, 14, 13, 13);

    // Window with sky tint: sx: 1, sy: 48, sw: 14, sh: 16 at x: 116, y: 12
    const hour = this.gameState?.time?.hour !== undefined ? this.gameState.time.hour : 6;
    const isRaining = this.gameState && (this.gameState.weather === 'rainy' || this.gameState.weather === 'stormy');
    let windowSky = '#7dd3fc'; // Daylight clear sky
    if (isRaining) windowSky = '#334155'; // Dark stormy slate sky through window
    else if (hour < 6 || hour >= 20) windowSky = '#0f172a'; // Night
    else if (hour >= 6 && hour < 8) windowSky = '#fbcfe8'; // Dawn pink
    else if (hour >= 17 && hour < 20) windowSky = '#fdba74'; // Sunset orange
    ctx.fillStyle = windowSky;
    ctx.fillRect(118, 14, 10, 12);
    if (isRaining) {
      // Draw trickling raindrops on window glass
      ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
      const t = Math.floor(Date.now() / 240);
      ctx.fillRect(120, 14 + (t % 10), 1, 2);
      ctx.fillRect(123, 14 + ((t + 4) % 10), 1, 2);
      ctx.fillRect(126, 14 + ((t + 7) % 10), 1, 2);
    }
    // Window frame
    ctx.drawImage(interior, 1, 48, 14, 16, 116, 12, 14, 16);
    // Curtains on both sides
    ctx.drawImage(interior, 16, 47, 16, 17, 108, 11, 16, 17);
    ctx.drawImage(interior, 32, 47, 16, 17, 122, 11, 16, 17);

    // 5. Cozy Green Rug (under table & entities): sx: 0, sy: 82, sw: 48, sh: 30
    ctx.drawImage(interior, 0, 82, 48, 30, 72, 66, 48, 30);

    // 6. Depth-Sorted Interior Entities (Y-Sorting)
    const entities = [];

    // Bed: sx: 87, sy: 8, sw: 18, sh: 34 at x: 24, y: 32
    entities.push({
      y: 66,
      render: () => {
        ctx.drawImage(interior, 87, 8, 18, 34, 24, 32, 18, 34);
      }
    });

    // Nightstand with green lamp
    entities.push({
      y: 52,
      render: () => {
        ctx.drawImage(interior, 112, 120, 16, 18, 44, 34, 16, 18);
        ctx.drawImage(interior, 34, 0, 11, 16, 46.5, 20, 11, 16);
      }
    });

    // Dining Table with Tablecloth & Red Tulips
    entities.push({
      y: 91,
      render: () => {
        ctx.drawImage(interior, 68, 120, 24, 23, 84, 68, 24, 23);
        ctx.drawImage(interior, 4, 1, 8, 15, 92, 58, 8, 15);
      }
    });

    // Left Chair: sx: 35, sy: 125, sw: 10, sh: 18 at x: 73, y: 70
    entities.push({
      y: 88,
      render: () => {
        ctx.drawImage(interior, 35, 125, 10, 18, 73, 70, 10, 18);
      }
    });

    // Right Chair: sx: 51, sy: 125, sw: 10, sh: 18 at x: 109, y: 70
    entities.push({
      y: 88,
      render: () => {
        ctx.drawImage(interior, 51, 125, 10, 18, 109, 70, 10, 18);
      }
    });

    // Brick Fireplace with Animated Flames
    entities.push({
      y: 66,
      render: () => {
        ctx.drawImage(interior, 115, 8, 26, 40, 140, 26, 26, 40);
        this.renderFireplaceFlames(ctx, 146, 52);
      }
    });

    // Player
    entities.push({
      y: this.player.y + 28,
      render: () => {
        this.renderPlayer(ctx);
      }
    });

    // Sort and render all entities
    entities.sort((a, b) => a.y - b.y);
    for (const ent of entities) {
      ent.render();
    }

    // 7. Fireplace Embers
    this.renderInteriorEmbers(ctx);

    // 8. Dynamic Radial Warm Hearth Light
    this.renderInteriorLighting(ctx);

    // 9. Floating Prompts (Bed & Exit)
    this.renderInteriorPrompts(ctx);
  }

  renderFireplaceFlames(ctx, hearthX, hearthY) {
    const time = Date.now() / 90;
    // Inside hearth opening: 14px wide, 10px tall
    // Firewood embers bed
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(hearthX + 2, hearthY + 8, 10, 2);

    // Dancing flame tongues
    const flameColors = ['#dc2626', '#ea580c', '#f59e0b', '#fef08a'];
    for (let i = 0; i < 4; i++) {
      const ox = i * 2.5 + Math.sin(time + i) * 1.2;
      const flameH = 4 + Math.sin(time * 1.5 + i * 2) * 3;
      ctx.fillStyle = flameColors[i];
      ctx.beginPath();
      ctx.arc(hearthX + 4 + ox, hearthY + 8 - flameH / 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderInteriorEmbers(ctx) {
    for (const emb of this.interiorEmbers) {
      ctx.fillStyle = emb.color;
      ctx.globalAlpha = Math.max(0, emb.life / emb.maxLife);
      ctx.fillRect(emb.x, emb.y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1.0;
  }

  renderInteriorLighting(ctx) {
    const hearthX = 153;
    const hearthY = 54;
    const flicker = Math.sin(Date.now() / 140) * 3 + Math.cos(Date.now() / 85) * 2;
    const radius = 88 + flicker;

    // Warm radial glow from the fireplace
    const grad = ctx.createRadialGradient(hearthX, hearthY, 6, hearthX, hearthY, radius);
    grad.addColorStop(0, 'rgba(255, 180, 50, 0.32)');
    grad.addColorStop(0.4, 'rgba(255, 130, 20, 0.16)');
    grad.addColorStop(0.8, 'rgba(230, 80, 10, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 192, 144);
    ctx.restore();

    // Night dimming if late at night
    const hour = this.gameState?.time?.hour !== undefined ? this.gameState.time.hour : 6;
    if (hour >= 21 || hour < 5) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fillRect(16, 0, 160, 134);
    }
  }

  renderInteriorPrompts(ctx) {
    const bob = Math.sin(Date.now() / 250) * 2.5;
    ctx.font = '700 8px Rubik, sans-serif';
    ctx.textAlign = 'center';

    // Bed prompt
    if (this.isNearBed) {
      const promptText = "[E] Dormir no Quarto";
      const metrics = ctx.measureText(promptText);
      const boxW = metrics.width + 10;
      const boxH = 13;
      const boxX = 33 - boxW / 2;
      const boxY = 24 + bob;

      ctx.fillStyle = '#543118';
      ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = '#f7e6c4';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#3b220c';
      ctx.fillText(promptText, 33, boxY + 9);
    }

    // Radio Weather Station prompt
    if (this.isNearRadio) {
      const promptText = "[E] Previsão do Tempo 📻";
      const metrics = ctx.measureText(promptText);
      const boxW = metrics.width + 10;
      const boxH = 13;
      const boxX = 62 - boxW / 2;
      const boxY = 24 + bob;

      ctx.fillStyle = '#543118';
      ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = '#f7e6c4';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#3b220c';
      ctx.fillText(promptText, 62, boxY + 9);
    }

    // Exit prompt
    if (this.isNearInteriorExit) {
      const promptText = "[E] Sair para a Fazenda";
      const metrics = ctx.measureText(promptText);
      const boxW = metrics.width + 10;
      const boxH = 13;
      const boxX = 96 - boxW / 2;
      const boxY = 110 + bob;

      ctx.fillStyle = '#543118';
      ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = '#f7e6c4';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#3b220c';
      ctx.fillText(promptText, 96, boxY + 9);
    }
  }
}
