import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';

export default function GameCanvas({ 
  gameState, 
  selectedSlot, 
  onTileInteract, 
  onShowToast, 
  onInteractDoor,
  onCollectEgg,
  onChopTree,
  onMilkCow,
  onPetAnimal,
  onTransitionLocation,
  onOpenChest,
  isChestOpen,
  onTuneRadio,
  onStartProcessor,
  onCollectProcessor,
  engineRef 
}) {
  const canvasRef = useRef(null);
  const localEngineRef = useRef(null);

  // Initialize engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const engine = new GameEngine(
      canvas,
      onTileInteract,
      onShowToast,
      onInteractDoor,
      onCollectEgg,
      onChopTree,
      onMilkCow,
      onPetAnimal,
      onTransitionLocation,
      onOpenChest,
      onTuneRadio,
      onStartProcessor,
      onCollectProcessor
    );
    localEngineRef.current = engine;
    if (engineRef) engineRef.current = engine;

    engine.loadAssets().then(() => {
      console.log('[FZN Engine] Assets preloaded successfully.');
    });

    let lastTime = performance.now();
    let animationFrameId;

    function loop(currentTime) {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      engine.update(dt);
      engine.render();

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      engine.destroy();
    };
  }, []);

  // Synchronize callbacks and game state with engine
  useEffect(() => {
    if (localEngineRef.current) {
      localEngineRef.current.onTileInteract = onTileInteract;
      localEngineRef.current.onShowToast = onShowToast;
      localEngineRef.current.onInteractDoor = onInteractDoor;
      localEngineRef.current.onCollectEgg = onCollectEgg;
      localEngineRef.current.onChopTree = onChopTree;
      localEngineRef.current.onMilkCow = onMilkCow;
      localEngineRef.current.onPetAnimal = onPetAnimal;
      localEngineRef.current.onTransitionLocation = onTransitionLocation;
      localEngineRef.current.onOpenChest = onOpenChest;
      localEngineRef.current.onTuneRadio = onTuneRadio;
    }
  }, [onTileInteract, onShowToast, onInteractDoor, onCollectEgg, onChopTree, onMilkCow, onPetAnimal, onTransitionLocation, onOpenChest, onTuneRadio]);

  // Synchronize chest open animation state with engine
  useEffect(() => {
    if (localEngineRef.current) {
      localEngineRef.current.setChestOpen(isChestOpen);
    }
  }, [isChestOpen]);

  // Synchronize game state with engine
  useEffect(() => {
    if (localEngineRef.current && gameState) {
      localEngineRef.current.setGameState(gameState);
    }
  }, [gameState]);

  // Synchronize selected tool from hotbar
  useEffect(() => {
    if (localEngineRef.current && gameState) {
      const item = gameState.inventory?.find(i => i.slot === selectedSlot);
      localEngineRef.current.setSelectedTool(item || null);
    }
  }, [selectedSlot, gameState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair',
        zIndex: 1
      }}
    />
  );
}
