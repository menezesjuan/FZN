import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './api/client';
import { audio } from './game/audio';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import MarketModal from './components/MarketModal';
import RepairShopModal from './components/RepairShopModal';
import RanchModal from './components/RanchModal';
import ShopModal from './components/ShopModal';
import CraftingModal from './components/CraftingModal';
import ContractsModal from './components/ContractsModal';
import OfflineProgressModal from './components/OfflineProgressModal';
import TutorialModal from './components/TutorialModal';
import QuestTracker from './components/QuestTracker';
import cropsConfig from './config/crops.json';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(!api.getToken());
  const [farmState, setFarmState] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0);

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isContractsOpen, setIsContractsOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isRanchOpen, setIsRanchOpen] = useState(false);
  const [isRepairShopOpen, setIsRepairShopOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);
  const [offlineData, setOfflineData] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isMuted, setIsMuted] = useState(audio.isMuted());
  const [isIdleBotActive, setIsIdleBotActive] = useState(true);

  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 3200);
  }, []);

  const loadFarmState = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const res = await api.getState();
      setFarmState(res.state);
    } catch (err) {
      if (err.message.includes('Token') || err.message.includes('Sessão expirada')) {
        api.setToken(null);
        setCurrentUser(null);
        setIsAuthOpen(true);
      } else {
        console.error('Erro ao sincronizar fazenda:', err.message);
      }
    }
  }, []);

  // Check auth on boot
  useEffect(() => {
    if (api.getToken()) {
      api.getMe().then(data => {
        setCurrentUser(data.user);
        setIsAuthOpen(false);
        loadFarmState();
      }).catch(() => {
        api.setToken(null);
        setIsAuthOpen(true);
      });
    } else {
      setIsAuthOpen(true);
    }
  }, [loadFarmState]);

  // Periodic poll to keep crops and timers synced with server authority
  useEffect(() => {
    if (!currentUser) return;
    loadFarmState();
    const interval = setInterval(loadFarmState, 4000);
    return () => clearInterval(interval);
  }, [currentUser, loadFarmState]);

  function handleAuthenticated(user, offlineReport) {
    setCurrentUser(user);
    setIsAuthOpen(false);
    showToast(`Bem-vindo à sua fazenda, ${user.username}! 🌾`, 'success');
    if (!localStorage.getItem('fzn_tutorial_seen')) {
      setIsTutorialOpen(true);
    }
    if (offlineReport && offlineReport.elapsedMinutes > 5) {
      setOfflineData(offlineReport);
      setIsOfflineOpen(true);
    }
    loadFarmState();
  }

  function handleLogout() {
    api.setToken(null);
    setCurrentUser(null);
    setFarmState(null);
    setIsAuthOpen(true);
    showToast('Você saiu da sua fazenda.', 'info');
  }

  const handleToggleMute = useCallback(() => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
    showToast(nextMuted ? "Áudio desativado 🔇" : "Áudio ativado 🔊", "info");
  }, [showToast]);

  const handleCollectEgg = useCallback(async (eggId) => {
    try {
      const res = await api.collectEgg(eggId);
      showToast(res.message || 'Ovo fresco recolhido no pasto! 🥚', 'success');
      loadFarmState();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [loadFarmState, showToast]);

  const handlePetAnimal = useCallback(async (animalId) => {
    try {
      const res = await api.petAnimal(animalId);
      showToast(res.message || 'Animal acariciado com carinho! ❤️ (+15 XP)', 'info');
      loadFarmState();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [loadFarmState, showToast]);

  const handleTileInteract = useCallback(async (tx, ty, selectedTool) => {
    if (!farmState) return;
    const tile = farmState.tiles?.find(t => t.tile_x === tx && t.tile_y === ty);
    if (!tile) return;

    try {
      if (tile.state === 'READY') {
        const res = await api.harvestCrop(tile.id);
        showToast(res.message || 'Colheita realizada com sucesso! 🌾', 'success');
        loadFarmState();
        return;
      }

      const toolId = selectedTool?.id || '';
      if (toolId.startsWith('seed_') || toolId.startsWith('seeds_')) {
        if (tile.state === 'EMPTY') {
          await api.plantCrop(tile.id, toolId);
          showToast(`Semente plantada no canteiro (${tx}, ${ty})! 🌱`, 'success');
          loadFarmState();
        }
      } else if (toolId === 'tool_can' || toolId === 'watering_can') {
        await api.waterPlot(tile.id);
        showToast(`Canteiro (${tx}, ${ty}) irrigado! 💧`, 'info');
        loadFarmState();
      } else if (tile.state === 'EMPTY') {
        // Find any seed in inventory to plant
        const seedItem = (farmState.inventory || []).find(i => 
          (i.item_id?.startsWith('seed_') || i.item_id?.startsWith('seeds_') || i.id?.startsWith('seed_')) && i.quantity > 0
        );
        if (seedItem) {
          const sId = seedItem.item_id || seedItem.id;
          await api.plantCrop(tile.id, sId);
          showToast(`Plantado ${sId.replace(/seeds?_/, '')}! 🌱`, 'success');
          loadFarmState();
        } else {
          showToast('Equipe uma semente ou Regador para interagir!', 'info');
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [farmState, loadFarmState, showToast]);

  // Construct UI player object for compatibility with canvas & HUD
  const playerUi = farmState ? {
    id: farmState.farm.user_id,
    name: currentUser?.username || 'Fazendeiro',
    level: farmState.farm.level,
    xp: farmState.farm.xp,
    money: farmState.wallet.coins,
    energy: 100,
    maxEnergy: 100
  } : null;

  // Construct items inventory for Hotbar
  const inventoryUi = (farmState?.inventory || []).map((inv, idx) => ({
    slot: idx,
    id: inv.item_id,
    quantity: inv.quantity - inv.reserved,
    reserved: inv.reserved,
    quality: inv.quality
  }));

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#2c4c1a' }}>
      {/* Toast notifications */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}

      {/* Auth Modal if unauthenticated */}
      {isAuthOpen && (
        <AuthModal onAuthenticated={handleAuthenticated} />
      )}

      {/* Top Header & Bottom Hotbar HUD */}
      {farmState && (
        <HUD
          player={playerUi}
          inventory={inventoryUi}
          hotbar={inventoryUi}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          weather="sunny"
          time={{ season: 'Primavera', day: 1, year: 1 }}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenContracts={() => setIsContractsOpen(true)}
          onOpenManagement={() => setIsCraftingOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenRanch={() => setIsRanchOpen(true)}
          onOpenLicenses={() => setIsRepairShopOpen(true)}
          onOpenToolsShop={() => setIsRepairShopOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onLogout={handleLogout}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isIdleBotActive={isIdleBotActive}
          onToggleIdleBot={() => setIsIdleBotActive(!isIdleBotActive)}
          toolsOwned={farmState?.tools || []}
        />
      )}

      {/* Interactive Starter Quest Tracker */}
      {farmState && (
        <QuestTracker
          gameState={{
            player: playerUi,
            farm: farmState.farm,
            stats: farmState.stats || {},
            isIdleBotActive
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />
      )}

      {/* 2D Canvas Interactive Farm View */}
      {farmState && (
        <GameCanvas
          gameState={{
            player: playerUi,
            farm: {
              ...farmState.farm,
              width: farmState.farm.width || 24,
              height: farmState.farm.height || 18,
              tiles: farmState.farm.tiles || {},
              animals: farmState.animals || []
            },
            inventory: inventoryUi,
            toolsOwned: farmState.tools?.map(t => t.item_id || t.id) || ['tool_hoe', 'tool_can', 'tool_scythe'],
            weather: 'sunny',
            time: { season: 'Primavera', day: 1, year: 1, hour: 8, minute: 0 },
            cropsConfig: cropsConfig,
            idlePlots: [
              { id: 1, name: "Talhão Alfa", status: "AVAILABLE", cropId: null, bounds: { x1: 3, y1: 4, x2: 5, y2: 6 } },
              { id: 2, name: "Talhão Beta", status: "AVAILABLE", cropId: null, bounds: { x1: 7, y1: 4, x2: 9, y2: 6 } },
              { id: 3, name: "Talhão Gama", status: "AVAILABLE", cropId: null, bounds: { x1: 3, y1: 8, x2: 5, y2: 10 } },
              { id: 4, name: "Talhão Delta", status: "AVAILABLE", cropId: null, bounds: { x1: 7, y1: 8, x2: 9, y2: 10 } }
            ]
          }}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          isIdleBotActive={isIdleBotActive}
          onTileInteract={handleTileInteract}
          onCollectEgg={handleCollectEgg}
          onPetAnimal={handlePetAnimal}
          onShowToast={showToast}
        />
      )}

      {/* Modals */}
      <MarketModal
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        userWallet={farmState?.wallet}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      <RepairShopModal
        isOpen={isRepairShopOpen}
        onClose={() => setIsRepairShopOpen(false)}
        tools={farmState?.tools}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      <RanchModal
        isOpen={isRanchOpen}
        onClose={() => setIsRanchOpen(false)}
        animals={farmState?.animals}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={farmState?.inventory}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      <CraftingModal
        isOpen={isCraftingOpen}
        onClose={() => setIsCraftingOpen(false)}
        machines={farmState?.machines}
        farm={farmState?.farm}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      <ContractsModal
        isOpen={isContractsOpen}
        onClose={() => setIsContractsOpen(false)}
        onRefreshState={loadFarmState}
        showToast={showToast}
      />

      {isOfflineOpen && offlineData && (
        <OfflineProgressModal
          isOpen={isOfflineOpen}
          report={offlineData}
          onAcknowledge={() => setIsOfflineOpen(false)}
        />
      )}

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          localStorage.setItem('fzn_tutorial_seen', 'true');
        }}
      />
    </div>
  );
}
