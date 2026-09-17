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
import OfflineProgressModal from './components/OfflineProgressModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(!api.getToken());
  const [farmState, setFarmState] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(0);

  // Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
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

      {/* Main HUD */}
      {playerUi && (
        <HUD
          player={playerUi}
          time={{ season: 'Primavera', day: 1, hour: 10, minute: 0 }}
          weather="sunny"
          inventory={inventoryUi}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onOpenInventory={() => setIsShopOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenManagement={() => setIsCraftingOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenRanch={() => setIsRanchOpen(true)}
          onOpenLicenses={() => setIsRepairShopOpen(true)}
          onOpenToolsShop={() => setIsRepairShopOpen(true)}
          onLogout={handleLogout}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isIdleBotActive={isIdleBotActive}
          onToggleIdleBot={() => setIsIdleBotActive(!isIdleBotActive)}
          toolsOwned={farmState?.tools || []}
        />
      )}

      {/* 2D Canvas Interactive Farm View */}
      {farmState && (
        <GameCanvas
          gameState={{
            player: playerUi,
            farm: {
              ...farmState.farm,
              plots: farmState.tiles.map((t, idx) => ({
                id: t.id,
                plotIndex: idx,
                cropId: t.crop_id,
                state: t.state,
                isTilled: true,
                isWatered: t.watered === 1,
                growthProgress: t.growth_stage / 4,
                readyHarvest: t.state === 'READY'
              }))
            },
            inventory: inventoryUi,
            weather: 'sunny',
            time: { season: 'Primavera', day: 1 }
          }}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          isIdleBotActive={isIdleBotActive}
          onPlotInteraction={async (tileId, action) => {
            try {
              if (action === 'plant') {
                // Find first available seed in inventory
                const seedItem = inventoryUi.find(i => i.id.startsWith('seed_') && i.quantity > 0);
                if (!seedItem) {
                  showToast('Você não possui sementes no inventário! Compre na Loja (H).', 'error');
                  return;
                }
                await api.plantCrop(tileId, seedItem.id);
                showToast(`Plantado ${seedItem.id.replace('seed_', '')}! 🌱`, 'success');
              } else if (action === 'water') {
                await api.waterPlot(tileId);
                showToast('Canteiro regado! 💧', 'info');
              } else if (action === 'harvest') {
                const res = await api.harvestCrop(tileId);
                showToast(res.message, 'success');
              }
              loadFarmState();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }}
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

      {isOfflineOpen && offlineData && (
        <OfflineProgressModal
          isOpen={isOfflineOpen}
          report={offlineData}
          onAcknowledge={() => setIsOfflineOpen(false)}
        />
      )}
    </div>
  );
}
