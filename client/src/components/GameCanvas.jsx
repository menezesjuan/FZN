import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';

export default function GameCanvas({ 
  gameState, 
  selectedSlot, 
  onTileInteract, 
  onShowToast, 
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

    const engine = new GameEngine(canvas, onTileInteract, onShowToast);
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
