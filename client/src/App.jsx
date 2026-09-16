import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api/client';
import { audio } from './game/audio';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import QuestTracker from './components/QuestTracker';
import SleepModal from './components/SleepModal';
import InventoryModal from './components/InventoryModal';
import ShopModal from './components/ShopModal';
import ChestModal from './components/ChestModal';
import OfflineProgressModal from './components/OfflineProgressModal';
import ManagementDashboard from './components/ManagementDashboard';
import Toast from './components/Toast';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [itemsConfig, setItemsConfig] = useState(null);
  const [cropsConfig, setCropsConfig] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isOfflineReportOpen, setIsOfflineReportOpen] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.isMuted());
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const engineRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const prevLevelRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 2800);
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
    showToast(nextMuted ? "Áudio desativado 🔇" : "Áudio ativado 🔊", "info");
  }, [showToast]);

  // Fetch initial game state
  const loadState = useCallback(async () => {
    try {
      const data = await api.getState();
      if (data.state && prevLevelRef.current !== null && data.state.player.level > prevLevelRef.current) {
        audio.playLevelUp();
        showToast(`🎉 Parabéns! Você subiu para o Nível ${data.state.player.level}!`, 'success');
      }
      if (data.state) {
        prevLevelRef.current = data.state.player.level;
        if (data.state.offlineReport) {
          setIsOfflineReportOpen(true);
        }
      }
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
      } else if (e.key === 'm' || e.key === 'M') {
        setIsManagementOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsInventoryOpen(false);
        setIsShopOpen(false);
        setIsSleepModalOpen(false);
        setIsManagementOpen(false);
        setIsOfflineReportOpen(false);
        setIsChestOpen(prev => {
          if (prev) audio.playChestClose();
          return false;
        });
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
      // Check if clicked inside an Idle Production Plot
      const clickedPlot = gameState.idlePlots?.find(p =>
        x >= p.bounds.x1 && x <= p.bounds.x2 && y >= p.bounds.y1 && y <= p.bounds.y2
      );
      if (clickedPlot) {
        const isReady = clickedPlot.status === 'COMPLETED' ||
          (clickedPlot.status === 'RUNNING' && clickedPlot.completedAt && Date.now() >= clickedPlot.completedAt);
        if (isReady) {
          handleCollectPlot(clickedPlot.id);
        } else {
          setIsManagementOpen(true);
        }
        return;
      }

      // 1. If crop is ready to harvest, harvest takes priority regardless of tool held
      if (tile.crop && tile.crop.ready) {
        if (engineRef.current) {
          engineRef.current.triggerToolAction(x, y);
        }
        const res = await api.harvestCrop(x, y);
        if (res.success) {
          audio.playHarvest(res.harvested.quality);
          showToast(`Colheu ${res.harvested.quantity}x ${res.harvested.name} (${res.harvested.quality})!`, 'success');
          if (engineRef.current) {
            const qualityColor = res.harvested.quality === 'iridium' ? '#c084fc' : 
                                 res.harvested.quality === 'gold' ? '#facc15' : 
                                 res.harvested.quality === 'silver' ? '#e2e8f0' : '#4ade80';
            engineRef.current.addFloatingText(`+${res.harvested.quantity} ${res.harvested.name}!`, worldX, worldY, qualityColor);
            engineRef.current.addFloatingText(`+${res.harvested.xpGained} XP`, worldX, worldY - 12, '#38bdf8');
            engineRef.current.addParticleBurst(worldX, worldY, qualityColor, 14);
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
        if (engineRef.current) {
          engineRef.current.triggerToolAction(x, y);
        }
        const res = await api.tillTile(x, y);
        if (res.success) {
          audio.playTill();
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#8b5a2b', 10);
          }
          showToast("Solo arado!", "success");
          await loadState();
        }
      } else if (activeItem.id === 'tool_can') {
        if (engineRef.current) {
          engineRef.current.triggerToolAction(x, y);
        }
        const res = await api.waterTile(x, y);
        if (res.success) {
          audio.playWater();
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#38bdf8', 12);
            engineRef.current.addFloatingText("Regado!", worldX, worldY, '#38bdf8');
          }
          showToast("Solo regado!", "success");
          await loadState();
        }
      } else if (activeItem.id.startsWith('seeds_')) {
        if (engineRef.current) {
          engineRef.current.triggerToolAction(x, y);
        }
        const res = await api.plantCrop(x, y, activeItem.id);
        if (res.success) {
          audio.playPlant();
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

  // Collect egg handler from pasture
  const handleCollectEgg = async (eggId, eggX, eggY) => {
    try {
      const res = await api.collectEgg(eggId, eggX, eggY);
      if (res.success) {
        audio.playHarvest(res.egg.quality || 'normal');
        const qualityColor = res.egg.quality === 'gold' ? '#facc15' : 
                             res.egg.quality === 'silver' ? '#e2e8f0' : '#fde047';
        if (engineRef.current) {
          const worldX = eggX * 16 + 8;
          const worldY = eggY * 16 + 8;
          engineRef.current.addFloatingText(`+1 Ovo Caipira!`, worldX, worldY, qualityColor);
          engineRef.current.addFloatingText(`+8 XP`, worldX, worldY - 12, '#38bdf8');
          engineRef.current.addParticleBurst(worldX, worldY, '#fffbeb', 12);
        }
        showToast(res.message || "Ovo coletado com sucesso!", "success");
        await loadState();
      }
    } catch (err) {
      showToast(err.message, "warning");
    }
  };

  // Chop tree handler with axe
  const handleChopTree = async (treeId, tileX, tileY) => {
    try {
      const res = await api.chopTree(treeId, tileX, tileY);
      if (res.success) {
        const worldX = tileX * 16 + 16;
        const worldY = tileY * 16 + 36;

        if (res.actionResult === 'felled') {
          audio.playTreeFall();
          showToast(`Árvore derrubada! Coletou ${res.wood.quantity}x Madeira Rústica!`, 'success');
          if (engineRef.current) {
            const qualityColor = res.wood.quality === 'gold' ? '#facc15' : 
                                 res.wood.quality === 'silver' ? '#e2e8f0' : '#d4a373';
            engineRef.current.addFloatingText(`+${res.wood.quantity}x Madeira!`, worldX, worldY, qualityColor);
            engineRef.current.addFloatingText(`+${res.xpGained} XP`, worldX, worldY - 12, '#38bdf8');
            engineRef.current.addParticleBurst(worldX, worldY, '#8b5a2b', 14);
            engineRef.current.addParticleBurst(worldX, worldY - 10, '#558b2f', 10);
          }
        } else if (res.actionResult === 'cleared') {
          audio.playTreeFall();
          showToast(`Toco removido! Coletou ${res.wood.quantity}x Madeira Rústica!`, 'success');
          if (engineRef.current) {
            engineRef.current.addFloatingText(`+${res.wood.quantity}x Madeira!`, worldX, worldY, '#d4a373');
            engineRef.current.addFloatingText(`+${res.xpGained} XP`, worldX, worldY - 12, '#38bdf8');
            engineRef.current.addParticleBurst(worldX, worldY, '#8b5a2b', 12);
          }
        } else {
          // Regular hit
          audio.playChop();
          if (engineRef.current) {
            engineRef.current.addParticleBurst(worldX, worldY, '#a16207', 7);
            engineRef.current.addFloatingText('-2 ⚡', worldX, worldY - 8, '#f97316');
          }
        }
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'warning');
    }
  };

  // Milk cow handler
  const handleMilkCow = async (cowId, tileX, tileY) => {
    try {
      const res = await api.milkCow(cowId, tileX, tileY);
      if (res.success) {
        audio.playMilkSquirt();
        const worldX = tileX * 16 + 16;
        const worldY = tileY * 16 + 16;

        const qualityColor = res.milk.quality === 'gold' ? '#facc15' : 
                             res.milk.quality === 'silver' ? '#e2e8f0' : '#ffffff';
        if (engineRef.current) {
          engineRef.current.addFloatingText(`+1x Leite Fresco!`, worldX, worldY, qualityColor);
          engineRef.current.addFloatingText(`+${res.milk.xpGained} XP`, worldX, worldY - 12, '#38bdf8');
          engineRef.current.addParticleBurst(worldX, worldY, '#ffffff', 14);
        }
        showToast(`Ordenha concluída! Obteve 1x ${res.milk.name} (${res.milk.quality})!`, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'warning');
    }
  };

  // Pet animal handler
  const handlePetAnimal = async (animalId) => {
    try {
      await api.petAnimal(animalId);
    } catch (err) {
      // Affection update in background
    }
  };

  // Buy item handler
  const handleBuy = async (itemId, quantity) => {
    try {
      const res = await api.buyItem(itemId, quantity);
      if (res.success) {
        audio.playCoin();
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
        audio.playCoin();
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

  // Handle room transitions (farm <-> house_interior)
  const handleTransitionLocation = async (targetLocation) => {
    setIsFading(true);
    if (targetLocation === 'house_interior') {
      audio.playDoorOpen();
    } else {
      audio.playDoorClose();
    }

    setTimeout(async () => {
      try {
        if (targetLocation === 'house_interior') {
          if (engineRef.current) {
            engineRef.current.setLocation('house_interior', 92, 114, 'up');
          }
          await api.transitionLocation('house_interior', 5.5, 7);
          showToast("Entrou na casa da fazenda. Que aconchego! 🏡", "info");
        } else {
          if (engineRef.current) {
            engineRef.current.setLocation('farm', 280, 96, 'down');
          }
          await api.transitionLocation('farm', 17.5, 6);
          showToast("Saiu para o ar fresco da fazenda! 🌾", "info");
        }
        await loadState();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setTimeout(() => setIsFading(false), 200);
      }
    }, 320);
  };

  // Confirm sleep and pass to next day
  const handleConfirmSleep = async () => {
    setIsSleepModalOpen(false);
    setIsFading(true);
    audio.playSleepTransition();

    try {
      const res = await api.sleep();
      setTimeout(async () => {
        await loadState();
        if (engineRef.current && engineRef.current.location === 'house_interior') {
          engineRef.current.setLocation('house_interior', 48, 48, 'down');
        }
        showToast(res.message || "Amanheceu um novo dia na sua fazenda! 🌅", 'success');
        setIsFading(false);
      }, 1000);
    } catch (err) {
      setIsFading(false);
      showToast(err.message, 'error');
    }
  };

  // Storage Chest Handlers
  const handleOpenChest = useCallback(() => {
    audio.playChestOpen();
    setIsChestOpen(true);
  }, []);

  const handleCloseChest = useCallback(() => {
    audio.playChestClose();
    setIsChestOpen(false);
  }, []);

  const handleDepositToChest = async (inventorySlot, quantity) => {
    try {
      const res = await api.depositToChest(inventorySlot, quantity);
      if (res.success) {
        audio.playCoin();
        showToast("Item guardado no baú!", "success");
        await loadState();
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleWithdrawFromChest = async (chestSlot, quantity) => {
    try {
      const res = await api.withdrawFromChest(chestSlot, quantity);
      if (res.success) {
        audio.playCoin();
        showToast("Item retirado do baú!", "success");
        await loadState();
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleQuickStackChest = async () => {
    try {
      const res = await api.quickStackChest();
      if (res.success) {
        audio.playCoin();
        showToast(res.message || "Itens agrupados no baú!", "success");
        await loadState();
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Weather Radio Handler
  const handleTuneRadio = useCallback(async () => {
    audio.playRadioJingle();
    try {
      const forecast = await api.getWeatherForecast();
      if (forecast && forecast.tomorrow) {
        showToast(`📻 Rádio de FZN: "${forecast.tomorrow.description}"`, 'info');
      }
    } catch (err) {
      showToast("📻 Rádio de FZN: 'Amanhã o dia será propício para o trabalho no campo!'", 'info');
    }
  }, [showToast]);

  // Dev toggle weather
  const handleDevToggleWeather = async () => {
    try {
      const current = gameState?.weather || 'sunny';
      const next = current === 'sunny' ? 'rainy' : (current === 'rainy' ? 'stormy' : 'sunny');
      const res = await api.devSetWeather(next);
      if (res.success) {
        showToast(`Clima alterado para: ${next === 'stormy' ? 'Tempestade ⛈️' : (next === 'rainy' ? 'Chuva 🌧️' : 'Ensolarado ☀️')}`, 'info');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStartPlot = async (plotId, cropId) => {
    try {
      const res = await api.startPlotProduction(plotId, cropId);
      if (res.success) {
        audio.playPlant();
        showToast(`Talhão iniciado com ${res.plot.cropName}!`, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCollectPlot = async (plotId) => {
    try {
      const res = await api.collectPlot(plotId);
      if (res.success) {
        audio.playHarvest(res.collected.quality);
        showToast(`Colheu ${res.collected.quantity}x ${res.collected.cropName}! (+${res.collected.xpGained} XP)`, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCollectAllPlots = async () => {
    try {
      const res = await api.collectAllPlots();
      if (res.success) {
        audio.playHarvest('gold');
        showToast(`Sucesso! ${res.collectedCount} talhões colhidos (+${res.totalXP} XP)!`, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCollectFacility = async (facilityId) => {
    try {
      const res = await api.collectFacility(facilityId);
      if (res.success) {
        if (facilityId === 'coop') audio.playEgg();
        else if (facilityId === 'barn') audio.playMilk();
        showToast(`Recolheu ${res.collected.quantity}x ${res.collected.name}! (+${res.collected.xpGained} XP)`, 'success');
        await loadState();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAcknowledgeOffline = async () => {
    try {
      await api.acknowledgeOfflineReport();
      setIsOfflineReportOpen(false);
      await loadState();
    } catch (err) {
      setIsOfflineReportOpen(false);
    }
  };

  const handleOfflineCollectAll = async () => {
    try {
      let anyCollected = false;
      try {
        const pRes = await api.collectAllPlots();
        if (pRes.success) anyCollected = true;
      } catch (_) {}

      if (gameState?.facilities?.coop?.currentYield > 0) {
        try {
          await api.collectFacility('coop');
          anyCollected = true;
        } catch (_) {}
      }

      if (gameState?.facilities?.barn?.currentYield > 0) {
        try {
          await api.collectFacility('barn');
          anyCollected = true;
        } catch (_) {}
      }

      await api.acknowledgeOfflineReport();
      setIsOfflineReportOpen(false);
      audio.playHarvest('gold');
      showToast(anyCollected ? "Todos os recursos foram recolhidos com sucesso!" : "Relatório finalizado!", "success");
      await loadState();
    } catch (err) {
      showToast(err.message, 'error');
      setIsOfflineReportOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} />

      {/* Screen Fade to Black Transition for Sleep & Room Transitions */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        opacity: isFading ? 1 : 0,
        pointerEvents: isFading ? 'all' : 'none',
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 99
      }} />

      {/* Main Game Canvas */}
      <GameCanvas
        gameState={gameState}
        selectedSlot={selectedSlot}
        onTileInteract={handleTileInteract}
        onShowToast={showToast}
        onInteractDoor={() => setIsSleepModalOpen(true)}
        onOpenChest={handleOpenChest}
        isChestOpen={isChestOpen}
        onTuneRadio={handleTuneRadio}
        onCollectEgg={handleCollectEgg}
        onChopTree={handleChopTree}
        onMilkCow={handleMilkCow}
        onPetAnimal={handlePetAnimal}
        onTransitionLocation={handleTransitionLocation}
        engineRef={engineRef}
      />

      {/* Interactive HUD */}
      <HUD
        player={gameState?.player}
        time={gameState?.time}
        weather={gameState?.weather || 'sunny'}
        inventory={gameState?.inventory || []}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenManagement={() => setIsManagementOpen(prev => !prev)}
        onDevAdvanceTime={handleDevAdvanceTime}
        onDevRestoreEnergy={handleDevRestoreEnergy}
        onDevToggleWeather={handleDevToggleWeather}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        itemsConfig={itemsConfig}
      />

      {/* Dynamic Quest & Onboarding Guide */}
      <QuestTracker gameState={gameState} />

      {/* Sleep in Farmhouse Modal */}
      <SleepModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onConfirmSleep={handleConfirmSleep}
        time={gameState?.time}
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

      {/* Rustic Storage Chest Modal */}
      <ChestModal
        isOpen={isChestOpen}
        onClose={handleCloseChest}
        chest={gameState?.farm?.chest || []}
        inventory={gameState?.inventory || []}
        itemsConfig={itemsConfig}
        onDeposit={handleDepositToChest}
        onWithdraw={handleWithdrawFromChest}
        onQuickStack={handleQuickStackChest}
      />

      {/* Idle Management Dashboard Modal */}
      <ManagementDashboard
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        idlePlots={gameState?.idlePlots || []}
        facilities={gameState?.facilities || {}}
        cropsConfig={cropsConfig || {}}
        playerMoney={gameState?.player?.money || 0}
        stats={gameState?.stats || {}}
        onStartPlot={handleStartPlot}
        onCollectPlot={handleCollectPlot}
        onCollectAllPlots={handleCollectAllPlots}
        onCollectFacility={handleCollectFacility}
      />

      {/* Welcome Back / Offline Progress Modal */}
      <OfflineProgressModal
        isOpen={isOfflineReportOpen}
        report={gameState?.offlineReport}
        onCollectAll={handleOfflineCollectAll}
        onClose={handleAcknowledgeOffline}
      />
    </div>
  );
}
