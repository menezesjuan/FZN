import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api/client';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import InventoryModal from './components/InventoryModal';
import ShopModal from './components/ShopModal';
import Toast from './components/Toast';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [itemsConfig, setItemsConfig] = useState(null);
  const [cropsConfig, setCropsConfig] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const engineRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 2800);
  }, []);

  // Fetch initial game state
  const loadState = useCallback(async () => {
    try {
      const data = await api.getState();
      setGameState(data.state);
      setCatalog(data.catalog || []);
      setItemsConfig(data.itemsConfig || null);
      setCropsConfig(data.cropsConfig || null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadState();
    // Periodic refresh for crop growth sync
    const interval = setInterval(loadState, 3000);
    return () => clearInterval(interval);
  }, [loadState]);

  // Keyboard hotkeys for slots and modals
  useEffect(() => {
    function handleKeyDown(e) {
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        setSelectedSlot(parseInt(e.key, 10) - 1);
      } else if (e.key === 'i' || e.key === 'I') {
        setIsInventoryOpen(prev => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsShopOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsInventoryOpen(false);
        setIsShopOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle player clicking a tile
  const handleTileInteract = async (x, y, activeItem) => {
    if (!gameState) return;

    const tileKey = `${x},${y}`;
    const tile = gameState.farm.tiles[tileKey];
    if (!tile) return;

    const worldX = x * 16 + 8;
    const worldY = y * 16 + 8;

    try {
      // 1. If crop is ready to harvest, harvest takes priority regardless of tool held
      if (tile.crop && tile.crop.ready) {
        const res = await api.harvestCrop(x, y);
        if (res.success) {
          showToast(`Colheu ${res.harvested.quantity}x ${res.harvested.name} (${res.harvested.quality})!`, 'success');
          if (engineRef.current) {
            const qualityColor = res.harvested.quality === 'iridium' ? '#c084fc' : 
                                 res.harvested.quality === 'gold' ? '#facc15' : 
                                 res.harvested.quality === 'silver' ? '#e2e8f0' : '#4ade80';
            engineRef.current.addFloatingText(`+${res.harvested.quantity} ${res.harvested.name}!`, worldX, worldY, qualityColor);
            engineRef.current.addFloatingText(`+${res.harvested.xpGained} XP`, worldX, worldY - 12, '#38bdf8');
            engineRef.current.addParticleBurst(worldX, worldY, qualityColor, 12);
          }
          await loadState();
        }
        return;
      }

      // 2. Perform action based on active tool / item in hand
      if (!activeItem) {
        showToast("Selecione uma ferramenta ou semente na barra inferior.", "info");
        return;
      }

      if (activeItem.id === 'tool_hoe') {
        const res = await api.tillTile(x, y);
        if (res.success) {
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#8b5a2b', 8);
          }
          showToast("Solo arado!", "success");
          await loadState();
        }
      } else if (activeItem.id === 'tool_can') {
        const res = await api.waterTile(x, y);
        if (res.success) {
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#38bdf8', 10);
            engineRef.current.addFloatingText("Regado!", worldX, worldY, '#38bdf8');
          }
          showToast("Solo regado!", "success");
          await loadState();
        }
      } else if (activeItem.id.startsWith('seeds_')) {
        const res = await api.plantCrop(x, y, activeItem.id);
        if (res.success) {
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#4ade80', 8);
            engineRef.current.addFloatingText("Plantado!", worldX, worldY, '#4ade80');
          }
          showToast(res.message, "success");
          await loadState();
        }
      } else {
        showToast("Selecione a enxada para arar ou sementes para plantar.", "info");
      }
    } catch (err) {
      showToast(err.message, "warning");
    }
  };

  // Buy item handler
  const handleBuy = async (itemId, quantity) => {
    try {
      const res = await api.buyItem(itemId, quantity);
      if (res.success) {
        showToast(res.message, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Sell item handler
  const handleSell = async (slotIndex, quantity) => {
    try {
      const res = await api.sellItem(slotIndex, quantity);
      if (res.success) {
        showToast(res.message, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Dev advance time helper
  const handleDevAdvanceTime = async () => {
    try {
      await api.devAdvanceTime(60);
      showToast("Avançou o tempo de cultivo em 60 segundos!", "info");
      await loadState();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Dev restore energy helper
  const handleDevRestoreEnergy = async () => {
    try {
      await api.devRestoreEnergy();
      showToast("Energia restaurada ao máximo!", "success");
      await loadState();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} />

      {/* Main Game Canvas */}
      <GameCanvas
        gameState={gameState}
        selectedSlot={selectedSlot}
        onTileInteract={handleTileInteract}
        onShowToast={showToast}
        engineRef={engineRef}
      />

      {/* Interactive HUD */}
      <HUD
        player={gameState?.player}
        time={gameState?.time}
        inventory={gameState?.inventory || []}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onDevAdvanceTime={handleDevAdvanceTime}
        onDevRestoreEnergy={handleDevRestoreEnergy}
        itemsConfig={itemsConfig}
      />

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={gameState?.inventory || []}
        itemsConfig={itemsConfig}
        selectedSlot={selectedSlot}
        onSelectItem={(slot) => {
          setSelectedSlot(slot);
        }}
      />

      {/* Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        catalog={catalog}
        inventory={gameState?.inventory || []}
        playerMoney={gameState?.player?.money || 0}
        itemsConfig={itemsConfig}
        onBuy={handleBuy}
        onSell={handleSell}
      />
    </div>
  );
}
