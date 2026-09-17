import { audio } from './audio';

// 2D Game Engine for FZN Farm — Refined with Collisions, Y-Sorting & World Composition
const TILE_SIZE = 16;
const ZOOM = 3; // 16 * 3 = 48px on screen

export class GameEngine {
  constructor(canvas, onTileInteract, onShowToast, onInteractDoor, onCollectEgg, onChopTree, onMilkCow, onPetAnimal, onTransitionLocation, onOpenChest, onTuneRadio, onStartProcessor, onCollectProcessor, onStartPlot, onCollectPlot) {
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
    this.onStartProcessor = onStartProcessor;
    this.onCollectProcessor = onCollectProcessor;
    this.onStartPlot = onStartPlot;
    this.onCollectPlot = onCollectPlot;
    this.location = 'farm'; // 'farm' | 'house_interior'

    // 100% IDLE Autonomous Pilot Bot
    this.isIdleBotEnabled = true;
    this.manualInputTimer = 0;
    this.idleBotCooldown = 0;
    this.idleBotActionLabel = 'Vigilante da Fazenda';

    // Stardew Valley Artisan Machines (outdoor production yard next to chest)
    this.artisanMachines = [
      { id: 'cheese_press', name: 'Prensa de Queijo', x: 10 * TILE_SIZE, y: 5 * TILE_SIZE, icon: '🧀', inputName: 'Leite' },
      { id: 'mayo_machine', name: 'Maioneseira Rústica', x: 11 * TILE_SIZE, y: 5 * TILE_SIZE, icon: '🥚', inputName: 'Ovo' },
      { id: 'preserves_jar', name: 'Tacho de Geléia', x: 12 * TILE_SIZE, y: 5 * TILE_SIZE, icon: '🍓', inputName: 'Fruta' }
    ];

    // Stardew Valley Rarecrow in the central crossroads between the 4 plots
    this.scarecrow = { x: 6 * TILE_SIZE, y: 7 * TILE_SIZE };
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
      x: 5 * TILE_SIZE,
      y: 11 * TILE_SIZE,
      speed: 105, // pixels per second
      direction: 'down',
      isMoving: false,
      frame: 0,
      animTimer: 0,
      actionTimer: 0,
      // Hitbox relative to (x, y): 32x32 sprite, hitbox at bottom feet
      hitbox: { offsetX: 10, offsetY: 22, width: 12, height: 8 }
    };

    // World Static Obstacles & Decor (Moved to perimeter to leave field 100% open)
    this.trees = [
      { id: 'tree_1', x: 1 * TILE_SIZE, y: 1 * TILE_SIZE, type: 'maple' },
      { id: 'tree_2', x: 5 * TILE_SIZE, y: 1 * TILE_SIZE, type: 'maple' },
      { id: 'tree_3', x: 1 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'maple' },
      { id: 'tree_4', x: 1 * TILE_SIZE, y: 17 * TILE_SIZE, type: 'maple' },
      { id: 'tree_5', x: 22 * TILE_SIZE, y: 14 * TILE_SIZE, type: 'maple' },
      { id: 'tree_6', x: 22 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'maple' }
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
      // Main east-west road connecting House (x=18, y=6) to cultivation plots
      '18,6', '18,7', '17,7', '16,7', '15,7', '14,7', '13,7', '12,7', '11,7', '10,7', '9,7', '8,7', '7,7',
      // Central crossroads avenue between the 4 Idle Plots (Alfa, Beta, Gama, Delta)
      '2,7', '3,7', '4,7', '5,7', '6,7',
      '6,3', '6,4', '6,5', '6,6', '6,8', '6,9', '6,10', '6,11',
      // Branch towards storage chest & north workbench
      '13,6', '13,5',
      // Branch to chicken coop pasture gate (x=20, y=5)
      '19,6', '20,6', '20,5', '21,5',
      // Branch to dairy cattle pasture gate (x=18, y=9)
      '18,8', '17,8', '17,9', '17,10',
      // Branch towards south artisanal area
      '14,8', '14,9', '14,10'
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
      { key: 'interior', url: '/assets/Objects/Interior.png' },

      // All Fruit & Crop Subfolder Assets (Growth Spritesheets & High-Res Icons)
      { key: 'crop_berry', url: '/assets/crops/berry/growth_basic/berry_16x16_7frames.png' },
      { key: 'icon_berry', url: '/assets/crops/berry/icon/berry_icon_16x16.png' },
      { key: 'crop_strawberry', url: '/assets/crops/berry/growth_basic/berry_16x16_7frames.png' },
      { key: 'icon_strawberry', url: '/assets/crops/berry/icon/berry_icon_16x16.png' },
      { key: 'crop_blueberry', url: '/assets/crops/berry/growth_basic/berry_16x16_7frames.png' },
      { key: 'icon_blueberry', url: '/assets/crops/berry/icon/berry_icon_16x16.png' },
      { key: 'crop_grape', url: '/assets/crops/grape/growth_basic/grape_18x32_7frames.png' },
      { key: 'icon_grape', url: '/assets/crops/grape/icon/grape_icon_16x16_2frames.png' },
      { key: 'crop_tomato', url: '/assets/crops/tomato/growth_basic/tomato_16x32_23frames.png' },
      { key: 'icon_tomato', url: '/assets/crops/tomato/icon/tomato_icon_16x16_4frames.png' },
      { key: 'crop_wheat', url: '/assets/crops/wheat/growth_basic/wheat_18x32_8frames.png' },
      { key: 'icon_wheat', url: '/assets/crops/wheat/icon/wheat_icon_16x16_9frames.png' },
      { key: 'crop_corn', url: '/assets/crops/corn/growth_basic/corn_16x32_8frames.png' },
      { key: 'icon_corn', url: '/assets/crops/corn/icon/corn_icon_16x16_2frames.png' },
      { key: 'crop_carrot', url: '/assets/crops/carrot/growth_basic/carrot_16x16_7frames.png' },
      { key: 'icon_carrot', url: '/assets/crops/carrot/icon/carrot_icon_16x16_2frames.png' },
      { key: 'crop_radish', url: '/assets/crops/radish/growth_basic/radish_16x16_7frames.png' },
      { key: 'icon_radish', url: '/assets/crops/radish/icon/radish_icon_16x16_2frames.png' },
      { key: 'crop_potato', url: '/assets/crops/potato/growth_basic/potato_16x32_7frames.png' },
      { key: 'icon_potato', url: '/assets/crops/potato/icon/potato_icon_16x16.png' },
      { key: 'crop_pumpkin', url: '/assets/crops/pumpkin/growth_basic/pumpkin_16x16_7frames.png' },
      { key: 'icon_pumpkin', url: '/assets/crops/pumpkin/icon/pumpkin_icon_16x16_3frames.png' },
      { key: 'crop_melon', url: '/assets/crops/pumpkin/growth_basic/pumpkin_16x16_7frames.png' },
      { key: 'icon_melon', url: '/assets/crops/pumpkin/icon/pumpkin_icon_16x16_3frames.png' },
      { key: 'crop_onion', url: '/assets/crops/onion/growth_basic/onion_16x32_7frames.png' },
      { key: 'icon_onion', url: '/assets/crops/onion/icon/onion_icon_16x16.png' },
      { key: 'crop_leek', url: '/assets/crops/leek/growth_basic/leek_16x32_7frames.png' },
      { key: 'icon_leek', url: '/assets/crops/leek/icon/leek_icon_16x16.png' },
      { key: 'crop_lettuce', url: '/assets/crops/lettuce/growth_basic/lettuce_16x16_7frames.png' },
      { key: 'icon_lettuce', url: '/assets/crops/lettuce/icon/lettuce_icon_16x16.png' },
      { key: 'crop_cauliflower', url: '/assets/crops/cauliflower/growth_basic/cauliflower_16x16_7frames.png' },
      { key: 'icon_cauliflower', url: '/assets/crops/cauliflower/icon/cauliflower_icon_16x16.png' },
      { key: 'crop_beetroot', url: '/assets/crops/beetroot/growth_basic/beetroot_16x16_7frames.png' },
      { key: 'icon_beetroot', url: '/assets/crops/beetroot/icon/beetroot_icon_16x16.png' },
      { key: 'crop_broccoli', url: '/assets/crops/broccoli/growth_basic/broccoli_16x32_7frames.png' },
      { key: 'icon_broccoli', url: '/assets/crops/broccoli/icon/broccoli_icon_16x16.png' },
      { key: 'crop_bamboo', url: '/assets/crops/bamboo/growth_basic/bamboo_16x32_7frames.png' },
      { key: 'icon_bamboo', url: '/assets/crops/bamboo/icon/bamboo_icon_16x16_2frames.png' },
      { key: 'crop_celery', url: '/assets/crops/celery/growth_basic/celery_16x32_7frames.png' },
      { key: 'icon_celery', url: '/assets/crops/celery/icon/celery_icon_16x16.png' },
      { key: 'crop_eggplant', url: '/assets/crops/eggplant/growth_basic/eggplant_16x32_7frames.png' },
      { key: 'icon_eggplant', url: '/assets/crops/eggplant/icon/eggplant_icon_16x16.png' },
      { key: 'crop_pepper', url: '/assets/crops/pepper/growth_basic/pepper_16x32_11frames.png' },
      { key: 'icon_pepper', url: '/assets/crops/pepper/icon/pepper_icon_16x16_2frames.png' }
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

    // Check if clicked on an Artisan Machine (Cheese press, Mayo machine, Preserves jar)
    const clickedMachine = this.artisanMachines.find(m =>
      this.mouse.worldX >= m.x - 2 && this.mouse.worldX <= m.x + 18 &&
      this.mouse.worldY >= m.y - 2 && this.mouse.worldY <= m.y + 18
    );

    if (clickedMachine) {
      const dist = Math.hypot(clickedMachine.x + 8 - playerCenterX, clickedMachine.y + 8 - playerCenterY);
      if (dist > 46) {
        if (this.onShowToast) this.onShowToast(`Muito longe da ${clickedMachine.name}! Aproxime-se.`, "warning");
        return;
      }

      const procState = this.gameState?.processors?.[clickedMachine.id];
      const isCompleted = procState?.status === 'COMPLETED' ||
        (procState?.status === 'PROCESSING' && procState.completedAt && Date.now() >= procState.completedAt);

      if (isCompleted) {
        if (this.onCollectProcessor) {
          this.onCollectProcessor(clickedMachine.id);
        }
      } else if (procState?.status === 'PROCESSING') {
        const rem = Math.max(0, Math.ceil((procState.completedAt - Date.now()) / 1000));
        this.addFloatingText(`${clickedMachine.icon} ${rem}s restantes`, clickedMachine.x + 8, clickedMachine.y, '#38bdf8');
      } else {
        if (this.onStartProcessor) {
          this.onStartProcessor(clickedMachine.id);
        }
      }
      return;
    }

    // Check if clicked on Scarecrow
    if (this.mouse.worldX >= this.scarecrow.x - 2 && this.mouse.worldX <= this.scarecrow.x + 18 &&
        this.mouse.worldY >= this.scarecrow.y - 2 && this.mouse.worldY <= this.scarecrow.y + 18) {
      const dist = Math.hypot(this.scarecrow.x + 8 - playerCenterX, this.scarecrow.y + 8 - playerCenterY);
      if (dist <= 48) {
        this.addFloatingText("🌾 Espantalho FZN: Lavouras Protegidas!", this.scarecrow.x + 8, this.scarecrow.y - 12, '#fef08a');
        this.addParticleBurst(this.scarecrow.x + 8, this.scarecrow.y + 8, '#f59e0b', 8);
      }
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

    // Check if clicked inside an Idle Cultivation Plot (smart boundary distance)
    const clickedPlot = this.gameState?.idlePlots?.find(p =>
      tx >= p.bounds.x1 && tx <= p.bounds.x2 && ty >= p.bounds.y1 && ty <= p.bounds.y2
    );

    if (clickedPlot) {
      const playerTileX = playerCenterX / TILE_SIZE;
      const playerTileY = playerCenterY / TILE_SIZE;
      const clampedX = Math.max(clickedPlot.bounds.x1, Math.min(playerTileX, clickedPlot.bounds.x2 + 1));
      const clampedY = Math.max(clickedPlot.bounds.y1, Math.min(playerTileY, clickedPlot.bounds.y2 + 1));
      const plotDist = Math.hypot(clampedX - playerTileX, clampedY - playerTileY);

      if (plotDist > 4.5) {
        if (this.onShowToast) {
          this.onShowToast(`Aproxime-se do ${clickedPlot.name} para interagir.`, "warning");
        }
        return;
      }

      if (this.onTileInteract) {
        this.onTileInteract(tx, ty, this.selectedTool);
      }
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
      // Prune deceased animals
      this.animals = this.animals.filter(local => {
        const s = state.farm.animals.find(a => a.id === local.id);
        return s && s.isAlive !== false;
      });

      state.farm.animals.forEach(serverAnimal => {
        if (serverAnimal.isAlive === false) return;
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
        local.harvestsRemaining = serverAnimal.harvestsRemaining;
        local.maxHarvests = serverAnimal.maxHarvests;
        local.isAlive = serverAnimal.isAlive !== false;
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

  setIdleBot(enabled) {
    this.isIdleBotEnabled = !!enabled;
    if (!this.isIdleBotEnabled) {
      this.idleBotActionLabel = 'Piloto Pausado';
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

    // 3. Storage Chest & Artisan Machines
    const chestBox = { x: this.chest.x + 1, y: this.chest.y + 4, w: 14, h: 12 };
    if (intersects(box, chestBox)) return true;

    // Artisan Machines (cheese press, mayo machine, preserves jar)
    for (const m of this.artisanMachines) {
      const mBox = { x: m.x + 1, y: m.y + 4, w: 14, h: 12 };
      if (intersects(box, mBox)) return true;
    }

    // Scarecrow collision
    const scarecrowBox = { x: this.scarecrow.x + 4, y: this.scarecrow.y + 8, w: 8, h: 8 };
    if (intersects(box, scarecrowBox)) return true;

    // 4. Maple Trees (Trunks solid at the base)
    for (const tree of this.trees) {
      // Tree is 32x48, trunk is at (x + 10, y + 36), size: 12x10
      const trunkBox = { x: tree.x + 10, y: tree.y + 36, w: 12, h: 10 };
      if (intersects(box, trunkBox)) return true;
    }

    // 5. Perimeter & Pasture Fences
    // Seam between farmhouse and chicken coop (completely closes the 8px trap so player/bot never gets wedged)
    const houseChickenSeam = { x: 18.2 * TILE_SIZE, y: 1 * TILE_SIZE, w: 1.2 * TILE_SIZE, h: 4.8 * TILE_SIZE };
    if (intersects(box, houseChickenSeam)) return true;

    // Top border fence (except path gap)
    const topFence = { x: 7 * TILE_SIZE, y: 1 * TILE_SIZE, w: 6 * TILE_SIZE, h: 12 };
    if (intersects(box, topFence)) return true;

    // Pasture top fence: x=19 to 23 at y=1
    const pastureTopFence = { x: 19 * TILE_SIZE, y: 1 * TILE_SIZE, w: 4.5 * TILE_SIZE, h: 12 };
    if (intersects(box, pastureTopFence)) return true;

    // Pasture right fence: x=23, y=1 to 5
    const pastureRightFence = { x: 23 * TILE_SIZE, y: 1 * TILE_SIZE, w: 12, h: 4.5 * TILE_SIZE };
    if (intersects(box, pastureRightFence)) return true;

    // Pasture left fence: x=19, y=1 to 4.5
    const pastureLeftFence = { x: 19 * TILE_SIZE, y: 1 * TILE_SIZE, w: 12, h: 4.2 * TILE_SIZE };
    if (intersects(box, pastureLeftFence)) return true;

    // Pasture bottom corner at x=19, y=5
    const pastureBottomCorner = { x: 19 * TILE_SIZE, y: 5 * TILE_SIZE, w: 12, h: 12 };
    if (intersects(box, pastureBottomCorner)) return true;

    // Pasture bottom fence right wing: x=22 to 23 at y=5 (gate is completely clear at x=19.8 to 22.0, 35px wide)
    const pastureBottomFence = { x: 22.2 * TILE_SIZE, y: 5 * TILE_SIZE, w: 1.5 * TILE_SIZE, h: 12 };
    if (intersects(box, pastureBottomFence)) return true;

    // Cattle pasture fences (south-east meadow, aligned x=18 to 23, y=8 to 12)
    const cattleTopFence = { x: 18 * TILE_SIZE, y: 8 * TILE_SIZE, w: 5.5 * TILE_SIZE, h: 12 };
    if (intersects(box, cattleTopFence)) return true;

    const cattleRightFence = { x: 23 * TILE_SIZE, y: 8 * TILE_SIZE, w: 12, h: 4.5 * TILE_SIZE };
    if (intersects(box, cattleRightFence)) return true;

    const cattleBottomFence = { x: 18 * TILE_SIZE, y: 12 * TILE_SIZE, w: 5.5 * TILE_SIZE, h: 12 };
    if (intersects(box, cattleBottomFence)) return true;

    // Cattle west fence: y=10.3 to 12 at x=18 (wide 28px gate opening from y=8.5 to 10.3)
    const cattleLeftFence = { x: 18 * TILE_SIZE, y: 10.3 * TILE_SIZE, w: 12, h: 2.2 * TILE_SIZE };
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

    // Check manual keyboard movement input
    let manualDx = 0;
    let manualDy = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) manualDy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) manualDy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) manualDx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) manualDx += 1;

    const hasManualMovement = manualDx !== 0 || manualDy !== 0;

    if (hasManualMovement) {
      this.manualInputTimer = 2.0; // Pause autonomous bot for 2s during and after manual keypress
      this.idleBotActionLabel = 'Controle Manual';

      if (manualDx !== 0 && manualDy !== 0) {
        manualDx *= 0.7071;
        manualDy *= 0.7071;
      }

      this.player.isMoving = true;
      if (Math.abs(manualDx) > Math.abs(manualDy)) {
        this.player.direction = manualDx > 0 ? 'right' : 'left';
      } else {
        this.player.direction = manualDy > 0 ? 'down' : 'up';
      }

      this.applyPlayerMovement(manualDx, manualDy, dt);
    } else {
      if (this.manualInputTimer > 0) {
        this.manualInputTimer = Math.max(0, this.manualInputTimer - dt);
        this.player.isMoving = false;
        this.updatePlayerIdleAnimation(dt);
      } else if (this.isIdleBotEnabled && this.location === 'farm') {
        // Run 100% IDLE Autonomous Bot
        this.updateIdleBot(dt);
      } else {
        this.player.isMoving = false;
        this.updatePlayerIdleAnimation(dt);
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
      // Outdoor farm camera: smooth, fluid centering on the player (Stardew Valley style)
      const targetCamX = this.player.x + 16;
      const targetCamY = this.player.y + 16;
      this.camera.x += (targetCamX - this.camera.x) * Math.min(1, dt * 8);
      this.camera.y += (targetCamY - this.camera.y) * Math.min(1, dt * 8);

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

  applyPlayerMovement(dx, dy, dt) {
    const moveDistX = dx * this.player.speed * dt;
    const moveDistY = dy * this.player.speed * dt;

    // Test X movement
    const testBoxX = {
      x: this.player.x + moveDistX + this.player.hitbox.offsetX,
      y: this.player.y + this.player.hitbox.offsetY,
      w: this.player.hitbox.width,
      h: this.player.hitbox.height
    };

    let movedX = false;
    if (!this.checkCollision(testBoxX)) {
      this.player.x += moveDistX;
      movedX = true;
    }

    // Test Y movement
    const testBoxY = {
      x: this.player.x + this.player.hitbox.offsetX,
      y: this.player.y + moveDistY + this.player.hitbox.offsetY,
      w: this.player.hitbox.width,
      h: this.player.hitbox.height
    };

    let movedY = false;
    if (!this.checkCollision(testBoxY)) {
      this.player.y += moveDistY;
      movedY = true;
    }

    // Walk animation steps
    this.player.animTimer += dt;
    if (this.player.animTimer >= 0.11) {
      this.player.animTimer = 0;
      this.player.frame = (this.player.frame + 1) % 6;
      if (this.player.frame === 1 || this.player.frame === 4) {
        audio.playFootstep();
      }
    }

    return { movedX, movedY };
  }

  updatePlayerIdleAnimation(dt) {
    this.player.animTimer += dt;
    if (this.player.animTimer >= 0.25) {
      this.player.animTimer = 0;
      this.player.frame = (this.player.frame + 1) % 4;
    }
  }

  navigateTowards(targetX, targetY, dt) {
    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;
    let dx = targetX - playerCenterX;
    let dy = targetY - playerCenterY;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      this.player.isMoving = false;
      this.updatePlayerIdleAnimation(dt);
      return;
    }

    dx /= dist;
    dy /= dist;

    this.player.isMoving = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.player.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.player.direction = dy > 0 ? 'down' : 'up';
    }

    const { movedX, movedY } = this.applyPlayerMovement(dx, dy, dt);

    // Obstacle slide assistance if running into fence/wall edge
    if (!movedX && !movedY) {
      if (Math.abs(dx) > Math.abs(dy)) {
        const nudgeDir = dy !== 0 ? Math.sign(dy) : 1;
        this.applyPlayerMovement(0, nudgeDir * 0.7, dt);
      } else {
        const nudgeDir = dx !== 0 ? Math.sign(dx) : 1;
        this.applyPlayerMovement(nudgeDir * 0.7, 0, dt);
      }
    }
  }

  updateIdleBot(dt) {
    if (!this.gameState || this.location !== 'farm') return;

    if (this.idleBotCooldown > 0) {
      this.idleBotCooldown = Math.max(0, this.idleBotCooldown - dt);
    }

    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;

    // Anti-stuck watchdog to prevent getting trapped against fence edges
    if (!this.stuckTracker) {
      this.stuckTracker = { lastX: this.player.x, lastY: this.player.y, timer: 0 };
    }
    const movedDist = Math.hypot(this.player.x - this.stuckTracker.lastX, this.player.y - this.stuckTracker.lastY);
    if (this.player.isMoving && movedDist < 2) {
      this.stuckTracker.timer += dt;
      if (this.stuckTracker.timer > 1.0) {
        // If trapped in narrow space between house and pasture, pull directly to open stone avenue
        if (this.player.x >= 17.5 * TILE_SIZE && this.player.x <= 20.5 * TILE_SIZE && this.player.y < 6.8 * TILE_SIZE) {
          this.player.x = 17 * TILE_SIZE;
          this.player.y = 7.2 * TILE_SIZE;
        } else {
          // Nudge player towards central open stone avenue (y = 7.2 * 16)
          const openAvenueY = 7.2 * TILE_SIZE;
          this.player.y += (openAvenueY > this.player.y ? 1 : -1) * 50 * dt;
        }
        this.stuckTracker.timer = 0;
      }
    } else {
      this.stuckTracker.lastX = this.player.x;
      this.stuckTracker.lastY = this.player.y;
      this.stuckTracker.timer = 0;
    }

    // 1. Prioridade 1: Colheita de Talhões Prontos (Ready Crops)
    const readyPlot = this.gameState.idlePlots?.find(p =>
      p.status === 'COMPLETED' || (p.status === 'RUNNING' && p.completedAt && Date.now() >= p.completedAt)
    );

    if (readyPlot) {
      const targetX = ((readyPlot.bounds.x1 + readyPlot.bounds.x2) / 2) * TILE_SIZE;
      const targetY = ((readyPlot.bounds.y1 + readyPlot.bounds.y2) / 2) * TILE_SIZE;
      const dist = Math.hypot(targetX - playerCenterX, targetY - playerCenterY);

      this.idleBotActionLabel = `Colhendo ${readyPlot.name}...`;

      if (dist < 32) {
        this.player.isMoving = false;
        this.updatePlayerIdleAnimation(dt);

        if (this.idleBotCooldown <= 0) {
          const tx = Math.floor(targetX / TILE_SIZE);
          const ty = Math.floor(targetY / TILE_SIZE);
          this.triggerToolAction(tx, ty);
          audio.playHarvest(readyPlot.quality || 'normal');
          if (this.onCollectPlot) {
            this.onCollectPlot(readyPlot.id);
          } else if (this.onTileInteract) {
            this.onTileInteract(tx, ty);
          }
          this.idleBotCooldown = 1.0;
        }
        return;
      } else {
        this.navigateTowards(targetX, targetY, dt);
        return;
      }
    }

    // 2. Prioridade 2: Replantio de Talhões Livres (Auto Replant)
    const availablePlot = this.gameState.idlePlots?.find(p => p.status === 'AVAILABLE');
    if (availablePlot) {
      const season = this.gameState.time?.season || 'Primavera';
      const defaultCrops = {
        'Primavera': 'crop_strawberry',
        'Verão': 'crop_blueberry',
        'Outono': 'crop_pumpkin',
        'Inverno': null
      };
      const candidateCrop = availablePlot.assignedCropId || defaultCrops[season] || 'crop_onion';

      if (candidateCrop && season !== 'Inverno') {
        const targetX = ((availablePlot.bounds.x1 + availablePlot.bounds.x2) / 2) * TILE_SIZE;
        const targetY = ((availablePlot.bounds.y1 + availablePlot.bounds.y2) / 2) * TILE_SIZE;
        const dist = Math.hypot(targetX - playerCenterX, targetY - playerCenterY);

        this.idleBotActionLabel = `Replantando ${availablePlot.name}...`;

        if (dist < 32) {
          this.player.isMoving = false;
          this.updatePlayerIdleAnimation(dt);

          if (this.idleBotCooldown <= 0) {
            const tx = Math.floor(targetX / TILE_SIZE);
            const ty = Math.floor(targetY / TILE_SIZE);
            this.triggerToolAction(tx, ty);
            audio.playPlant();
            if (this.onStartPlot) {
              this.onStartPlot(availablePlot.id, candidateCrop);
            }
            this.idleBotCooldown = 1.0;
          }
          return;
        } else {
          this.navigateTowards(targetX, targetY, dt);
          return;
        }
      }
    }

    // 3. Prioridade 3: Ovos no Solo do Pasto
    const egg = this.gameState.farm?.eggs && this.gameState.farm.eggs.length > 0 ? this.gameState.farm.eggs[0] : null;
    if (egg) {
      const targetX = egg.x * TILE_SIZE + 8;
      const targetY = egg.y * TILE_SIZE + 8;
      const dist = Math.hypot(targetX - playerCenterX, targetY - playerCenterY);

      this.idleBotActionLabel = 'Recolhendo Ovo no Pasto...';

      // Pick up egg from up to 38px (generous 2.4 tiles reach)
      if (dist < 38) {
        this.player.isMoving = false;
        this.updatePlayerIdleAnimation(dt);

        if (this.idleBotCooldown <= 0) {
          this.triggerToolAction(egg.x, egg.y);
          audio.playEgg();
          if (this.onCollectEgg) {
            this.onCollectEgg(egg.id, egg.x, egg.y);
          }
          this.idleBotCooldown = 1.0;
        }
        return;
      }

      // Pasture Entry Navigation:
      // Is player already inside the chicken pasture or at the gate threshold?
      const isInsideCoop = playerCenterX >= 19.2 * TILE_SIZE && playerCenterY <= 5.8 * TILE_SIZE;

      if (isInsideCoop) {
        // Inside the coop enclosure: move directly towards the target egg!
        this.navigateTowards(targetX, targetY, dt);
      } else {
        // Outside the coop: route cleanly around the farmhouse via open avenue
        // Farmhouse is at x: 14 to 18.5, y: 1 to 7
        if (playerCenterX < 19.5 * TILE_SIZE) {
          if (playerCenterY < 6.8 * TILE_SIZE) {
            // West of farmhouse: first step down to open avenue
            this.navigateTowards(playerCenterX, 7.2 * TILE_SIZE, dt);
          } else {
            // On open avenue: head east to gate entrance
            this.navigateTowards(20.5 * TILE_SIZE, 7.2 * TILE_SIZE, dt);
          }
        } else {
          // East of farmhouse: walk straight north through the open gate
          if (playerCenterY > 5.2 * TILE_SIZE) {
            this.navigateTowards(20.5 * TILE_SIZE, 4.5 * TILE_SIZE, dt);
          } else {
            this.navigateTowards(targetX, targetY, dt);
          }
        }
      }
      return;
    }

    // 4. Prioridade 4: Ordenhar Vacas Leiteiras
    const currentDay = this.gameState.time?.day || 1;
    const hasPail = this.gameState.toolsOwned?.includes('tool_pail');
    const readyCow = this.animals?.find(a =>
      (a.type === 'female_cow' || a.type === 'male_cow') &&
      a.isAlive !== false &&
      a.lastMilkedDay !== currentDay
    );

    if (readyCow && hasPail) {
      const cowCenterX = readyCow.x + 16;
      const cowCenterY = readyCow.y + 16;
      const dist = Math.hypot(cowCenterX - playerCenterX, cowCenterY - playerCenterY);

      this.idleBotActionLabel = `Ordenhando ${readyCow.name}...`;

      // Milking reach is 48px (3 tiles), allowing comfortable milking from gate/fence
      if (dist < 48) {
        this.player.isMoving = false;
        this.updatePlayerIdleAnimation(dt);

        if (this.idleBotCooldown <= 0) {
          const tx = Math.floor(cowCenterX / TILE_SIZE);
          const ty = Math.floor(cowCenterY / TILE_SIZE);
          this.triggerToolAction(tx, ty);
          audio.playMilk();
          if (this.onMilkCow) {
            this.onMilkCow(readyCow.id, tx, ty);
          }
          this.idleBotCooldown = 1.2;
        }
        return;
      }

      // Cattle Enclosure Navigation
      const isInsideCattlePen = playerCenterX >= 18 * TILE_SIZE && playerCenterY >= 8.5 * TILE_SIZE;

      if (isInsideCattlePen) {
        // Inside the cattle pen: move directly to cow
        this.navigateTowards(cowCenterX, cowCenterY, dt);
      } else {
        // Outside the cattle pen: must route through the west gate at (17.5, 9.5)
        if (playerCenterY < 8.0 * TILE_SIZE) {
          // North of cattle pen (e.g. leaving chicken coop or on stone avenue):
          if (playerCenterX > 17.5 * TILE_SIZE) {
            // Move along the stone avenue (y = 7.2) west to clear fence
            this.navigateTowards(17.5 * TILE_SIZE, 7.2 * TILE_SIZE, dt);
          } else {
            // At x <= 17.5: walk south down to the gate opening (y = 9.5)
            this.navigateTowards(17.5 * TILE_SIZE, 9.5 * TILE_SIZE, dt);
          }
        } else {
          // At y >= 8.0: approach gate from the west
          if (playerCenterX < 17.5 * TILE_SIZE) {
            this.navigateTowards(17.5 * TILE_SIZE, 9.5 * TILE_SIZE, dt);
          } else {
            this.navigateTowards(cowCenterX, cowCenterY, dt);
          }
        }
      }
      return;
    }

    // 5. Prioridade 5: Recolher Máquinas Artesanais Prontas
    if (this.gameState.processors) {
      for (const machine of this.artisanMachines) {
        const proc = this.gameState.processors[machine.id];
        if (proc && (proc.status === 'COMPLETED' || (proc.status === 'PROCESSING' && proc.completedAt && Date.now() >= proc.completedAt))) {
          const targetX = machine.x + 8;
          const targetY = machine.y + 8;
          const dist = Math.hypot(targetX - playerCenterX, targetY - playerCenterY);

          this.idleBotActionLabel = `Recolhendo da ${machine.name}...`;

          if (dist < 24) {
            this.player.isMoving = false;
            this.updatePlayerIdleAnimation(dt);

            if (this.idleBotCooldown <= 0) {
              if (this.onCollectProcessor) {
                this.onCollectProcessor(machine.id);
              }
              this.idleBotCooldown = 1.0;
            }
            return;
          } else {
            this.navigateTowards(targetX, targetY, dt);
            return;
          }
        }
      }
    }

    // 6. Patrulha / Posição Vigilante
    const patrolX = 6 * TILE_SIZE + 8;
    const patrolY = 7 * TILE_SIZE + 8;
    const dist = Math.hypot(patrolX - playerCenterX, patrolY - playerCenterY);

    if (dist > 20) {
      this.idleBotActionLabel = 'Retornando à Posição Central...';
      this.navigateTowards(patrolX, patrolY, dt);
    } else {
      this.idleBotActionLabel = '100% IDLE: Vigilante da Fazenda';
      this.player.isMoving = false;
      this.updatePlayerIdleAnimation(dt);
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
      // 0.5 Draw Surrounding Forest & Backdrop
      this.renderSurroundingForest(ctx);

      // 1. Draw Farm Ground (Grass, Tilled soil, Watered highlight, Stone paths)
      this.renderFarmGround(ctx);

      // 1.5 Draw Idle Cultivation Plots Ground
      this.renderIdlePlotsGround(ctx);

      // 2. Draw Depth-Sorted Entities (Y-Sorting: Character, Fences, House, Trees, Chest, Crops, Animals)
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

  isInsideIdlePlot(x, y) {
    if (!this.gameState || !this.gameState.idlePlots) return false;
    for (const plot of this.gameState.idlePlots) {
      if (x >= plot.bounds.x1 && x <= plot.bounds.x2 && y >= plot.bounds.y1 && y <= plot.bounds.y2) {
        return true;
      }
    }
    return false;
  }

  renderSurroundingForest(ctx) {
    const tileset = this.images.tileset;
    const treeImg = this.images.tree;
    const farmW = this.gameState?.farm?.width || 24;
    const farmH = this.gameState?.farm?.height || 18;

    // Outer margin expansion to fill widescreen displays without any dark void
    const minX = -22;
    const maxX = farmW + 22;
    const minY = -18;
    const maxY = farmH + 18;

    // 1. Draw outer lush grass backdrop across entire viewport
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Skip inside main farm boundaries (drawn in renderFarmGround)
        if (x >= 0 && x < farmW && y >= 0 && y < farmH) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (tileset) {
          ctx.drawImage(tileset, 16, 16, 16, 16, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#4d8a28' : '#55942d';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // 2. Dense boundary forest trees (Stardew Valley mountain & forest borders)
    if (treeImg) {
      // Top northern forest border
      for (let x = -2; x <= farmW + 2; x += 2) {
        ctx.drawImage(treeImg, 96, 0, 32, 48, x * TILE_SIZE - 8, -48, 32, 48);
        ctx.drawImage(treeImg, 96, 0, 32, 48, (x + 1) * TILE_SIZE - 8, -32, 32, 48);
      }
      // Western forest border
      for (let y = -2; y <= farmH + 2; y += 2) {
        ctx.drawImage(treeImg, 96, 0, 32, 48, -48, y * TILE_SIZE - 20, 32, 48);
        ctx.drawImage(treeImg, 96, 0, 32, 48, -32, (y + 1) * TILE_SIZE - 20, 32, 48);
      }
      // Southern forest border
      for (let x = -2; x <= farmW + 2; x += 2) {
        ctx.drawImage(treeImg, 96, 0, 32, 48, x * TILE_SIZE - 8, farmH * TILE_SIZE + 4, 32, 48);
      }
      // Eastern forest border behind pastures
      for (let y = -2; y <= farmH + 2; y += 2) {
        ctx.drawImage(treeImg, 96, 0, 32, 48, farmW * TILE_SIZE + 8, y * TILE_SIZE - 16, 32, 48);
        ctx.drawImage(treeImg, 96, 0, 32, 48, farmW * TILE_SIZE + 24, (y + 1) * TILE_SIZE - 16, 32, 48);
      }
    }
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

        // If covered by an elevated Idle Plot, render clean grass foundation only
        if (this.isInsideIdlePlot(x, y)) {
          if (tileset) {
            ctx.drawImage(tileset, 16, 16, 16, 16, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = '#5c9e31';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
          continue;
        }

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

  renderIdlePlotsGround(ctx) {
    if (!this.gameState || !this.gameState.idlePlots) return;

    for (const plot of this.gameState.idlePlots) {
      const { x1, y1, x2, y2 } = plot.bounds;
      const plotScreenX = x1 * TILE_SIZE;
      const plotScreenY = y1 * TILE_SIZE;
      const plotW = (x2 - x1 + 1) * TILE_SIZE;
      const plotH = (y2 - y1 + 1) * TILE_SIZE;

      const isRunning = plot.status === 'RUNNING';
      const isReady = plot.status === 'COMPLETED' || (isRunning && plot.completedAt && Date.now() >= plot.completedAt);

      // 1. Raised Garden Bed Wooden Outer Frame (Stardew Valley aesthetic)
      ctx.fillStyle = '#6d4c41'; // Dark oak wood frame
      ctx.fillRect(plotScreenX - 1, plotScreenY - 1, plotW + 2, plotH + 2);
      ctx.fillStyle = '#8d6e63'; // Lighter wood bevel
      ctx.fillRect(plotScreenX, plotScreenY, plotW, plotH);

      // 2. Interior Tilled Soil
      if (isRunning || isReady) {
        // Deep moist composted soil
        ctx.fillStyle = isReady ? '#3e2723' : '#4e342e';
        ctx.fillRect(plotScreenX + 2, plotScreenY + 2, plotW - 4, plotH - 4);

        // Neat furrow lines across the bed
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let fy = plotScreenY + 7; fy < plotScreenY + plotH - 2; fy += 8) {
          ctx.fillRect(plotScreenX + 3, fy, plotW - 6, 2);
        }

        // Moist soil water glisten
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.fillRect(plotScreenX + 2, plotScreenY + 2, plotW - 4, plotH - 4);
      } else {
        // Empty prepared soil bed waiting for seeds
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(plotScreenX + 2, plotScreenY + 2, plotW - 4, plotH - 4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let fy = plotScreenY + 7; fy < plotScreenY + plotH - 2; fy += 8) {
          ctx.fillRect(plotScreenX + 4, fy, plotW - 8, 1);
        }
      }

      // 3. Wooden corner reinforcement pegs
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(plotScreenX - 1, plotScreenY - 1, 3, 3);
      ctx.fillRect(plotScreenX + plotW - 2, plotScreenY - 1, 3, 3);
      ctx.fillRect(plotScreenX - 1, plotScreenY + plotH - 2, 3, 3);
      ctx.fillRect(plotScreenX + plotW - 2, plotScreenY + plotH - 2, 3, 3);

      // 4. Status Highlight & Wooden Nameplate
      ctx.strokeStyle = isReady ? '#22c55e' : (isRunning ? '#38bdf8' : 'rgba(217, 119, 6, 0.6)');
      ctx.lineWidth = 1;
      ctx.strokeRect(plotScreenX - 0.5, plotScreenY - 0.5, plotW + 1, plotH + 1);

      // Wooden Signboard with plot name
      ctx.fillStyle = '#451a03';
      ctx.fillRect(plotScreenX + 2, plotScreenY + 2, 46, 10);
      ctx.strokeStyle = '#92400e';
      ctx.strokeRect(plotScreenX + 2, plotScreenY + 2, 46, 10);
      ctx.fillStyle = isReady ? '#86efac' : (isRunning ? '#93c5fd' : '#fef08a');
      ctx.font = 'bold 7px monospace';
      ctx.fillText(plot.name.replace('Talhão ', 'T-'), plotScreenX + 5, plotScreenY + 9);
    }
  }

  renderFences(ctx) {
    // Deprecated standalone render, now handled dynamically inside renderDepthSortedEntities
  }

  renderDepthSortedEntities(ctx) {
    if (!this.gameState) return;

    const entities = [];

    // 0. Fences with Depth Sorting (Ensures animals & player walk properly behind south fences)
    const fenceImg = this.images.fence;
    if (fenceImg) {
      const drawPiece = (piece, tileX, tileY) => {
        let sx = 16, sy = 32;
        switch (piece) {
          case 'corner_nw':     sx = 0;  sy = 0;  break; // top-left corner
          case 'horizontal_t':  sx = 16; sy = 0;  break; // top horizontal rail
          case 'corner_ne':     sx = 32; sy = 0;  break; // top-right corner
          case 'vertical_w':    sx = 0;  sy = 16; break; // west vertical post
          case 'vertical_e':    sx = 32; sy = 16; break; // east vertical post
          case 'corner_sw':     sx = 0;  sy = 32; break; // bottom-left corner
          case 'horizontal_b':  sx = 16; sy = 32; break; // bottom horizontal rail
          case 'corner_se':     sx = 32; sy = 32; break; // bottom-right corner
          case 'post_cap_l':    sx = 16; sy = 48; break; // post cap ending left
          case 'post_cap_r':    sx = 32; sy = 48; break; // post cap ending right
          case 'post_isolated': sx = 16; sy = 64; break; // gate post
          default: break;
        }
        ctx.drawImage(fenceImg, sx, sy, 16, 16, tileX * TILE_SIZE, tileY * TILE_SIZE, 16, 16);
      };

      const addFence = (piece, tileX, tileY, sortYOffset = 15) => {
        entities.push({
          sortY: tileY * TILE_SIZE + sortYOffset,
          render: () => drawPiece(piece, tileX, tileY)
        });
      };

      // 1. Decorative fence above cultivation plots
      addFence('post_cap_l', 7, 1, 14);
      for (let x = 8; x <= 11; x++) addFence('horizontal_b', x, 1, 14);
      addFence('post_cap_r', 12, 1, 14);

      // 2. Chicken Pasture Enclosure
      addFence('corner_nw', 19, 1, 4);
      for (let x = 20; x <= 22; x++) addFence('horizontal_t', x, 1, 4);
      addFence('corner_ne', 23, 1, 4);

      for (let y = 2; y <= 4; y++) addFence('vertical_e', 23, y, 15);
      for (let y = 2; y <= 4; y++) addFence('vertical_w', 19, y, 15);

      addFence('corner_sw', 19, 5, 16);
      addFence('post_isolated', 19, 5, 16);
      // Open wide gate at x=20 and x=21 (walkway and entrance)
      addFence('post_isolated', 22, 5, 16);
      addFence('corner_se', 23, 5, 16);

      // 3. Cattle Pasture Enclosure
      addFence('corner_nw', 18, 8, 4);
      for (let x = 19; x <= 22; x++) addFence('horizontal_t', x, 8, 4);
      addFence('corner_ne', 23, 8, 4);

      for (let y = 9; y <= 11; y++) addFence('vertical_e', 23, y, 15);
      addFence('post_isolated', 18, 9, 15);
      for (let y = 10; y <= 11; y++) addFence('vertical_w', 18, y, 15);

      addFence('corner_sw', 18, 12, 16);
      for (let x = 19; x <= 22; x++) addFence('horizontal_b', x, 12, 16);
      addFence('corner_se', 23, 12, 16);
    }

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

    // 1.5 Stardew Valley Artisan Machines (Cheese Press, Mayo Machine, Preserves Jar)
    const now = Date.now();
    for (const machine of this.artisanMachines) {
      const procState = this.gameState?.processors?.[machine.id];
      const isCompleted = procState?.status === 'COMPLETED' ||
        (procState?.status === 'PROCESSING' && procState.completedAt && now >= procState.completedAt);
      const isProcessing = procState?.status === 'PROCESSING' && !isCompleted;

      entities.push({
        sortY: machine.y + 16,
        render: () => {
          const mx = machine.x;
          const my = machine.y;

          // Machine drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(mx + 8, my + 14, 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Gentle processing vibration
          const vibX = isProcessing ? (Math.sin(now / 60) * 0.8) : 0;
          const rx = mx + vibX;

          if (machine.id === 'cheese_press') {
            // Wood press frame
            ctx.fillStyle = '#78350f';
            ctx.fillRect(rx + 2, my + 3, 12, 12);
            ctx.fillStyle = '#92400e';
            ctx.fillRect(rx + 3, my + 4, 10, 10);
            // Metal screw press bar
            ctx.fillStyle = '#64748b';
            ctx.fillRect(rx + 6, my + 1, 4, 4);
            ctx.fillRect(rx + 4, my, 8, 2);
            // Curd basket inside
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(rx + 4, my + 7, 8, 6);
          } else if (machine.id === 'mayo_machine') {
            // White enamel machine cask
            ctx.fillStyle = '#475569';
            ctx.fillRect(rx + 2, my + 3, 12, 12);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(rx + 3, my + 4, 10, 10);
            // Brass gear handle
            ctx.fillStyle = '#d97706';
            ctx.fillRect(rx + 11, my + 6, 3, 4);
            ctx.fillRect(rx + 5, my + 1, 6, 2);
          } else if (machine.id === 'preserves_jar') {
            // Glass preserves jar with red fabric lid
            ctx.fillStyle = '#334155';
            ctx.fillRect(rx + 3, my + 5, 10, 10);
            ctx.fillStyle = isProcessing ? '#f43f5e' : '#e11d48';
            ctx.fillRect(rx + 4, my + 6, 8, 8);
            // Gingham cloth lid
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(rx + 3, my + 2, 10, 3);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(rx + 4, my + 4, 8, 1);
          }

          // Processing steam / smoke bubbles
          if (isProcessing) {
            const bubbleY = my - ((now / 40) % 14);
            const bubbleX = mx + 7 + Math.sin(now / 80) * 3;
            ctx.fillStyle = machine.id === 'preserves_jar' ? 'rgba(251, 113, 133, 0.65)' : 'rgba(241, 245, 249, 0.7)';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Completed Product Notification Bubble (Stardew style exclamation bobbing)
          if (isCompleted) {
            const bob = Math.sin(now / 150) * 3;
            const bubbleY = my - 16 + bob;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(mx - 1, bubbleY + 1, 18, 14);

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(mx - 1, bubbleY, 18, 13);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1;
            ctx.strokeRect(mx - 1, bubbleY, 18, 13);

            ctx.font = '10px sans-serif';
            ctx.fillText(machine.icon, mx + 2, bubbleY + 10);
          }
        }
      });
    }

    // 1.8 Stardew Valley Rarecrow (x=6, y=7 crossroads)
    entities.push({
      sortY: this.scarecrow.y + 16,
      render: () => {
        const scX = this.scarecrow.x;
        const scY = this.scarecrow.y;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(scX + 8, scY + 15, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden cross post
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(scX + 7, scY + 4, 2, 12);
        ctx.fillRect(scX + 1, scY + 7, 14, 2);

        // Straw hands
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(scX, scY + 6, 2, 4);
        ctx.fillRect(scX + 14, scY + 6, 2, 4);

        // Blue flannel shirt
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(scX + 4, scY + 6, 8, 6);
        ctx.fillStyle = '#ef4444'; // Red scarf
        ctx.fillRect(scX + 5, scY + 5, 6, 2);

        // Pumpkin/Turnip head & Straw Hat
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(scX + 8, scY + 4, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Broad-brim straw hat
        ctx.fillStyle = '#d97706';
        ctx.fillRect(scX + 3, scY + 1, 10, 2);
        ctx.fillRect(scX + 5, scY - 2, 6, 3);
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

    // 4. Crops (Rendered using dedicated assets from assets/crops/ subfolders)
    const cropsImg = this.images.crops;
    const farm = this.gameState.farm;
    const cropsConfig = this.gameState.cropsConfig || {};

    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        const key = `${x},${y}`;
        const tile = farm.tiles[key];
        if (!tile || !tile.crop || this.isInsideIdlePlot(x, y)) continue;

        const crop = tile.crop;
        const cropDef = cropsConfig[crop.id] || {};
        const maxStages = cropDef.stages || 6;
        const stage = Math.min(crop.stage || 0, maxStages - 1);

        // Check dedicated subfolder growth image
        const specificCropImg = this.images['crop_' + crop.id];
        const frameW = cropDef.frameWidth || 16;
        const frameH = cropDef.frameHeight || 32;
        const totalFrames = cropDef.totalFrames || maxStages;
        const frameIdx = Math.min(totalFrames - 1, Math.floor((stage / Math.max(1, maxStages - 1)) * (totalFrames - 1)));

        const destX = x * TILE_SIZE;
        const destY = frameH === 16 ? y * TILE_SIZE : y * TILE_SIZE - 16;
        const sortY = y * TILE_SIZE + 14;

        entities.push({
          sortY,
          render: () => {
            if (specificCropImg) {
              ctx.drawImage(specificCropImg, frameIdx * frameW, 0, frameW, frameH, destX, destY, frameW, frameH);
            } else if (cropsImg) {
              const rowIndex = cropDef.rowIndex !== undefined ? cropDef.rowIndex : 0;
              ctx.drawImage(cropsImg, stage * 16, (rowIndex % 4) * 32, 16, 32, destX, destY, 16, 32);
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

    // 4.1 Idle Cultivation Plot Crops, Sprinklers & Interactive Stardew Badges
    if (this.gameState && this.gameState.idlePlots) {
      const now = Date.now();
      for (const plot of this.gameState.idlePlots) {
        const { x1, y1, x2, y2 } = plot.bounds;
        const centerX = (x1 + 1) * TILE_SIZE;
        const centerY = (y1 + 1) * TILE_SIZE;

        const isReady = plot.status === 'COMPLETED' || (plot.status === 'RUNNING' && plot.completedAt && now >= plot.completedAt);
        const isRunning = plot.status === 'RUNNING' && !isReady;
        const isAvailable = plot.status === 'AVAILABLE';

        const cropDef = cropsConfig[plot.cropId] || {};
        const maxStages = cropDef.stages || 6;
        const specificPlotCropImg = this.images['crop_' + plot.cropId];
        const plotFrameW = cropDef.frameWidth || 16;
        const plotFrameH = cropDef.frameHeight || 32;
        const plotTotalFrames = cropDef.totalFrames || maxStages;

        let stage = maxStages - 1;
        let progressPct = 1;
        let remainingSeconds = 0;
        if (isRunning && plot.startedAt && plot.durationMs) {
          const elapsed = now - plot.startedAt;
          progressPct = Math.min(1, Math.max(0, elapsed / plot.durationMs));
          stage = Math.min(maxStages - 1, Math.floor(progressPct * maxStages));
          remainingSeconds = Math.max(0, Math.ceil((plot.completedAt - now) / 1000));
        }
        const plotFrameIdx = Math.min(plotTotalFrames - 1, Math.floor((stage / Math.max(1, maxStages - 1)) * (plotTotalFrames - 1)));

        // Draw Crops across the 3x3 bed (skipping center sprinkler)
        if (isRunning || isReady) {
          for (let ty = y1; ty <= y2; ty++) {
            for (let tx = x1; tx <= x2; tx++) {
              // Leave center space clear for the brass/gold Quality Sprinkler
              if (tx === x1 + 1 && ty === y1 + 1) continue;

              const destX = tx * TILE_SIZE;
              const destY = plotFrameH === 16 ? ty * TILE_SIZE : ty * TILE_SIZE - 16;
              const sortY = ty * TILE_SIZE + 14;

              entities.push({
                sortY,
                render: () => {
                  if (specificPlotCropImg) {
                    ctx.drawImage(specificPlotCropImg, plotFrameIdx * plotFrameW, 0, plotFrameW, plotFrameH, destX, destY, plotFrameW, plotFrameH);
                  } else if (cropsImg) {
                    const sourceRow = (cropDef.rowIndex || 0) % 4;
                    ctx.drawImage(cropsImg, stage * 16, sourceRow * 32, 16, 32, destX, destY, 16, 32);
                  }
                }
              });
            }
          }
        }

        // Central Stardew Valley Sprinkler & Interactive Badges
        entities.push({
          sortY: centerY + 18,
          render: () => {
            // 1. Central Quality Sprinkler (Brass base)
            const spX = centerX + 8;
            const spY = centerY + 8;

            ctx.fillStyle = '#b45309'; // Bronze base
            ctx.beginPath();
            ctx.arc(spX, spY + 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f59e0b'; // Gold head
            ctx.fillRect(spX - 2, spY - 3, 4, 4);

            // Water spray droplets animation
            const sprayAngle = (now / 200) % (Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
            for (let a = 0; a < 4; a++) {
              const ang = sprayAngle + (a * Math.PI / 2);
              const dropDist = 5 + Math.sin(now / 150 + a) * 2;
              const dx = spX + Math.cos(ang) * dropDist;
              const dy = spY + Math.sin(ang) * dropDist;
              ctx.beginPath();
              ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            // 2. Interactive Status Badges
            if (plot.autoLoop) {
              ctx.fillStyle = 'rgba(20, 83, 45, 0.9)';
              ctx.fillRect(spX - 12, spY - 32, 24, 8);
              ctx.strokeStyle = '#4ade80';
              ctx.lineWidth = 0.8;
              ctx.strokeRect(spX - 12, spY - 32, 24, 8);
              ctx.fillStyle = '#86efac';
              ctx.font = 'bold 5px sans-serif';
              ctx.fillText("🔁 IDLE", spX - 9, spY - 26);
            }

            if (plot.status === 'INSUFFICIENT_FUNDS') {
              const bounce = Math.sin(now / 150) * 2;
              const bannerY = spY - 22 + bounce;
              ctx.fillStyle = '#7f1d1d';
              ctx.fillRect(spX - 22, bannerY, 44, 11);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1;
              ctx.strokeRect(spX - 22, bannerY, 44, 11);
              ctx.fillStyle = '#fecaca';
              ctx.font = 'bold 6px sans-serif';
              ctx.fillText("⚠️ SEM SALDO", spX - 19, bannerY + 8);
            } else if (isReady) {
              // Stardew Valley Harvest Notification Banner (pulsing bobbing effect)
              const bounce = Math.sin(now / 160) * 3;
              const bannerY = spY - 26 + bounce;

              // Shadow
              ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
              ctx.fillRect(spX - 20, bannerY + 1, 40, 13);

              // Badge Body
              ctx.fillStyle = '#15803d'; // Rich green
              ctx.fillRect(spX - 20, bannerY, 40, 12);
              ctx.strokeStyle = '#86efac';
              ctx.lineWidth = 1;
              ctx.strokeRect(spX - 20, bannerY, 40, 12);

              // Exclamation particle
              ctx.fillStyle = '#fef08a';
              ctx.font = 'bold 7px sans-serif';
              ctx.fillText("🌾 COLHER!", spX - 17, bannerY + 9);
            } else if (isRunning) {
              // Compact Idle Progress Bar under sprinkler
              const barW = 26;
              const barH = 4;
              const barX = spX - barW / 2;
              const barY = spY - 14;

              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(barX, barY, Math.max(2, barW * progressPct), barH);
              ctx.strokeStyle = '#0284c7';
              ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

              // Tiny countdown text
              ctx.fillStyle = '#f8fafc';
              ctx.font = '6px monospace';
              ctx.fillText(`${remainingSeconds}s`, spX - 4, barY - 3);
            } else if (isAvailable) {
              // Empty Plot Invitation Sign
              const bounce = Math.sin(now / 250) * 2;
              const signY = spY - 18 + bounce;

              ctx.fillStyle = '#78350f';
              ctx.fillRect(spX - 16, signY, 32, 10);
              ctx.strokeStyle = '#d97706';
              ctx.strokeRect(spX - 16, signY, 32, 10);

              ctx.fillStyle = '#fef08a';
              ctx.font = 'bold 6px sans-serif';
              ctx.fillText("🌱 Plantar", spX - 13, signY + 7);
            }
          }
        });
      }
    }

    // 5. Pasture Animals (Chickens, chicks, and dairy cattle)
    for (const animal of this.animals) {
      if (animal.isAlive === false) continue;
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

            // Ready to collect egg bubble indicator if coop has accumulated eggs
            const coopAcc = this.gameState?.facilities?.coop?.accumulated || 0;
            if (animal.type === 'adult' && coopAcc > 0) {
              const bob = Math.sin(Date.now() / 240) * 2;
              ctx.font = '8px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.beginPath();
              ctx.arc(animal.x + 8, animal.y - 6 + bob, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.fillText('🥚', animal.x + 8, animal.y - 3 + bob);
            }
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

    // Floating Autonomous Bot Status Badge above player head
    if (this.isIdleBotEnabled && this.location === 'farm') {
      const tagText = `🤖 ${this.idleBotActionLabel || 'Piloto IDLE'}`;
      this.drawContextTooltip(ctx, posX + 16, posY - 4, tagText, '#10b981', '#6ee7b7');
    }
  }

  drawContextTooltip(ctx, worldX, worldY, text, borderColor = '#f59e0b', textColor = '#ffffff') {
    ctx.save();
    ctx.font = 'bold 7px sans-serif';
    const paddingX = 4;
    const paddingY = 2.5;
    const textMetrics = ctx.measureText(text);
    const boxW = Math.max(34, textMetrics.width + paddingX * 2);
    const boxH = 11;
    const boxX = Math.round(worldX - boxW / 2);
    const boxY = Math.round(worldY - boxH);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(boxX + 1, boxY + 1, boxW, boxH);

    // Rustic Wood/Slate tooltip background
    ctx.fillStyle = '#1c140e';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Highlight border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // Text with soft shadow
    ctx.fillStyle = '#000000';
    ctx.fillText(text, boxX + paddingX + 0.5, boxY + boxH - 3 + 0.5);
    ctx.fillStyle = textColor;
    ctx.fillText(text, boxX + paddingX, boxY + boxH - 3);

    ctx.restore();
  }

  renderHoverTile(ctx) {
    if (!this.gameState) return;

    const playerCenterX = this.player.x + 16;
    const playerCenterY = this.player.y + 24;

    // --- HOUSE INTERIOR HOVER INTERACTIONS ---
    if (this.location === 'house_interior') {
      const mx = this.mouse.worldX;
      const my = this.mouse.worldY;

      // 1. Radio Weather Station (x: 52 to 74, y: 8 to 32)
      if (mx >= 52 && mx <= 74 && my >= 8 && my <= 32) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(58, 12, 16, 16);
        this.drawContextTooltip(ctx, 66, 8, "📻 Previsão do Tempo", '#38bdf8');
        return;
      }

      // 2. Cozy Bed (x: 20 to 46, y: 30 to 70)
      if (mx >= 20 && mx <= 46 && my >= 30 && my <= 70) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(24, 34, 20, 32);
        this.drawContextTooltip(ctx, 34, 30, "🛏️ Dormir e Avançar Dia", '#c084fc');
        return;
      }

      // 3. Fireplace (x: 138 to 168, y: 24 to 68)
      if (mx >= 138 && mx <= 168 && my >= 24 && my <= 68) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(140, 32, 26, 32);
        this.drawContextTooltip(ctx, 153, 28, "🔥 Lareira Quentinha", '#fb923c');
        return;
      }

      // 4. Doorway Exit (x: 84 to 108, y: 120 to 140)
      if (mx >= 84 && mx <= 108 && my >= 120 && my <= 140) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(88, 124, 18, 14);
        this.drawContextTooltip(ctx, 97, 120, "🚪 Sair para Fazenda", '#4ade80');
        return;
      }
      return;
    }

    // --- OUTDOOR FARM HOVER INTERACTIONS ---
    const tx = this.mouse.tileX;
    const ty = this.mouse.tileY;

    // 1. Artisan Machines (Cheese press, Mayo machine, Preserves jar)
    const hoveredMachine = this.artisanMachines.find(m =>
      this.mouse.worldX >= m.x - 2 && this.mouse.worldX <= m.x + 18 &&
      this.mouse.worldY >= m.y - 2 && this.mouse.worldY <= m.y + 18
    );
    if (hoveredMachine) {
      const procState = this.gameState?.processors?.[hoveredMachine.id];
      const isCompleted = procState?.status === 'COMPLETED' ||
        (procState?.status === 'PROCESSING' && procState.completedAt && Date.now() >= procState.completedAt);
      const isProcessing = procState?.status === 'PROCESSING' && !isCompleted;

      ctx.strokeStyle = isCompleted ? '#4ade80' : (isProcessing ? '#38bdf8' : '#f59e0b');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoveredMachine.x + 0.5, hoveredMachine.y + 0.5, 15, 15);

      let label = `📥 Inserir ${hoveredMachine.inputName}`;
      let borderColor = '#d97706';
      if (isCompleted) {
        label = `✨ Coletar ${hoveredMachine.icon}`;
        borderColor = '#22c55e';
      } else if (isProcessing) {
        const rem = Math.max(0, Math.ceil((procState.completedAt - Date.now()) / 1000));
        label = `⚙️ Processando (${rem}s)`;
        borderColor = '#0284c7';
      }
      this.drawContextTooltip(ctx, hoveredMachine.x + 8, hoveredMachine.y - 4, label, borderColor);
      return;
    }

    // 2. Storage Chest (x=13, y=5)
    if (this.mouse.worldX >= this.chest.x - 2 && this.mouse.worldX <= this.chest.x + 18 &&
        this.mouse.worldY >= this.chest.y - 2 && this.mouse.worldY <= this.chest.y + 18) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.chest.x + 0.5, this.chest.y + 0.5, 15, 15);
      this.drawContextTooltip(ctx, this.chest.x + 8, this.chest.y - 4, "📦 Abrir Baú", '#d97706');
      return;
    }

    // 3. Scarecrow (x=6, y=7)
    if (this.mouse.worldX >= this.scarecrow.x - 2 && this.mouse.worldX <= this.scarecrow.x + 18 &&
        this.mouse.worldY >= this.scarecrow.y - 2 && this.mouse.worldY <= this.scarecrow.y + 18) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.scarecrow.x + 2.5, this.scarecrow.y + 0.5, 11, 15);
      this.drawContextTooltip(ctx, this.scarecrow.x + 8, this.scarecrow.y - 4, "🌾 Espantalho Protetor", '#ca8a04');
      return;
    }

    // 4. Pasture Animals (Chickens, Chicks, and Cows)
    const hoveredAnimal = this.animals.find(animal => {
      const isCow = animal.type === 'female_cow' || animal.type === 'male_cow';
      const hitboxRadius = isCow ? 16 : 12;
      const animalCenterX = animal.x + (isCow ? 16 : 8);
      const animalCenterY = animal.y + (isCow ? 16 : 8);
      return Math.hypot(animalCenterX - this.mouse.worldX, animalCenterY - this.mouse.worldY) < hitboxRadius;
    });

    if (hoveredAnimal) {
      const isCow = hoveredAnimal.type === 'female_cow' || hoveredAnimal.type === 'male_cow';
      const cx = hoveredAnimal.x + (isCow ? 16 : 8);
      const cy = hoveredAnimal.y + (isCow ? 16 : 8);

      // Soft halo under animal
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + (isCow ? 10 : 6), isCow ? 14 : 7, isCow ? 5 : 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const canMilk = isCow && hoveredAnimal.type === 'female_cow' && hoveredAnimal.lastMilkedDay !== this.gameState?.day;
      const tipText = canMilk ? `🥛 Ordenhar ${hoveredAnimal.name}` : `❤️ Carinho em ${hoveredAnimal.name}`;
      const borderColor = canMilk ? '#38bdf8' : '#f472b6';
      this.drawContextTooltip(ctx, cx, hoveredAnimal.y - 4, tipText, borderColor);
      return;
    }

    // 5. Trees & Stumps
    const hoveredTree = this.trees.find(tree =>
      this.mouse.worldX >= tree.x && this.mouse.worldX <= tree.x + 32 &&
      this.mouse.worldY >= tree.y && this.mouse.worldY <= tree.y + 48
    );
    if (hoveredTree) {
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoveredTree.x + 8.5, hoveredTree.y + 32.5, 15, 13);
      const hp = hoveredTree.health !== undefined ? hoveredTree.health : (hoveredTree.maxHealth || 3);
      const maxHp = hoveredTree.maxHealth || 3;
      this.drawContextTooltip(ctx, hoveredTree.x + 16, hoveredTree.y + 28, `🪓 Madeira (${hp}/${maxHp})`, '#ca8a04');
      return;
    }

    // 6. Idle Cultivation Plots (Full 3x3 Bed Highlight & Action Tooltip)
    if (this.gameState && this.gameState.idlePlots) {
      const hoveredPlot = this.gameState.idlePlots.find(p =>
        tx >= p.bounds.x1 && tx <= p.bounds.x2 && ty >= p.bounds.y1 && ty <= p.bounds.y2
      );

      if (hoveredPlot) {
        const px = hoveredPlot.bounds.x1 * TILE_SIZE;
        const py = hoveredPlot.bounds.y1 * TILE_SIZE;
        const pw = (hoveredPlot.bounds.x2 - hoveredPlot.bounds.x1 + 1) * TILE_SIZE;
        const ph = (hoveredPlot.bounds.y2 - hoveredPlot.bounds.y1 + 1) * TILE_SIZE;

        const isReady = hoveredPlot.status === 'COMPLETED' || (hoveredPlot.status === 'RUNNING' && hoveredPlot.completedAt && Date.now() >= hoveredPlot.completedAt);
        const isRunning = hoveredPlot.status === 'RUNNING' && !isReady;

        // Elegant Stardew decorative corners on the 48x48 bed
        const highlightColor = isReady ? '#4ade80' : (isRunning ? '#38bdf8' : '#fbbf24');
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);

        // L-shaped corner brackets
        const cl = 6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(px - 1, py + cl); ctx.lineTo(px - 1, py - 1); ctx.lineTo(px + cl, py - 1);
        // Top-right
        ctx.moveTo(px + pw + 1 - cl, py - 1); ctx.lineTo(px + pw + 1, py - 1); ctx.lineTo(px + pw + 1, py + cl);
        // Bottom-left
        ctx.moveTo(px - 1, py + ph + 1 - cl); ctx.lineTo(px - 1, py + ph + 1); ctx.lineTo(px + cl, py + ph + 1);
        // Bottom-right
        ctx.moveTo(px + pw + 1 - cl, py + ph + 1); ctx.lineTo(px + pw + 1, py + ph + 1); ctx.lineTo(px + pw + 1, py + ph + 1 - cl);
        ctx.stroke();

        let tip = `🌱 Plantar no ${hoveredPlot.name}`;
        let borderColor = '#d97706';
        if (isReady) {
          tip = `🌾 Clique para Colher (${hoveredPlot.name})`;
          borderColor = '#16a34a';
        } else if (isRunning) {
          const rem = Math.max(0, Math.ceil((hoveredPlot.completedAt - Date.now()) / 1000));
          tip = `⏳ Crescendo (${rem}s)`;
          borderColor = '#0284c7';
        }
        this.drawContextTooltip(ctx, px + pw / 2, py - 6, tip, borderColor);
        return;
      }
    }

    // 7. General Farm Tile Hover (with Reach check)
    if (tx >= 0 && tx < this.gameState.farm.width && ty >= 0 && ty < this.gameState.farm.height) {
      const screenX = tx * TILE_SIZE;
      const screenY = ty * TILE_SIZE;
      const tileCenterX = tx * TILE_SIZE + 8;
      const tileCenterY = ty * TILE_SIZE + 8;
      const inReach = (Math.hypot(tileCenterX - playerCenterX, tileCenterY - playerCenterY) / TILE_SIZE) <= 3.5;

      ctx.strokeStyle = inReach ? '#4ade80' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.fillStyle = inReach ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
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
