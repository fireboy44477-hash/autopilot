import React, { useEffect, useRef, useState } from 'react';
import { Zap, RotateCcw, Volume2, VolumeX, Shield, Gauge } from 'lucide-react';
import { playNitroSound, playHazardAlert } from '../../utils/audioFeedback';

interface TrafficCar {
  x: number;
  y: number;
  speed: number;
  lane: number;
  color: string;
}

export function CyberRacingArena({ onActionTrigger }: { onActionTrigger?: (action: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [autopilotActive, setAutopilotActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentSpeed, setCurrentSpeed] = useState<number>(185);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [dodges, setDodges] = useState<number>(0);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('Neural lane scanner active.');
  const [crashes, setCrashes] = useState<number>(0);

  const gameStateRef = useRef({
    playerLane: 2, // 5 lanes: 0, 1, 2, 3, 4
    targetLane: 2,
    playerX: 0,
    speed: 180,
    nitro: 100,
    traffic: [] as TrafficCar[],
    roadOffset: 0,
    keys: { left: false, right: false, boost: false }
  });

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lanes = [130, 210, 290, 370, 450]; // X centers for lanes
    gameStateRef.current.playerX = lanes[2];

    let lastTrafficSpawn = performance.now();

    const loop = (timestamp: number) => {
      const state = gameStateRef.current;

      // 1. TRAFFIC SPAWNER
      if (timestamp - lastTrafficSpawn > 900) {
        lastTrafficSpawn = timestamp;
        const availableLanes = [0, 1, 2, 3, 4].filter(
          l => !state.traffic.some(t => t.lane === l && t.y < 120)
        );
        if (availableLanes.length > 0) {
          const spawnLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
          const colors = ['#f43f5e', '#a855f7', '#fbbf24', '#06b6d4'];
          state.traffic.push({
            x: lanes[spawnLane],
            y: -60,
            speed: 3 + Math.random() * 2,
            lane: spawnLane,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }

      // 2. AUTOPILOT RADAR SCANNER & LANE SWITCHING
      if (autopilotActive) {
        // Find nearest car in current lane
        const dangerInCurrentLane = state.traffic.find(
          t => t.lane === state.playerLane && t.y > 60 && t.y < 280
        );

        if (dangerInCurrentLane) {
          // Find safest alternative lane
          let bestLane = state.playerLane;
          let maxGap = -1;

          [0, 1, 2, 3, 4].forEach(l => {
            const laneDiff = Math.abs(l - state.playerLane);
            if (laneDiff <= 1) { // adjacent lane
              const carsInLane = state.traffic.filter(t => t.lane === l);
              const closestDist = carsInLane.reduce((min, c) => Math.min(min, Math.abs(c.y - 240)), 9999);
              if (closestDist > maxGap) {
                maxGap = closestDist;
                bestLane = l;
              }
            }
          });

          if (bestLane !== state.playerLane) {
            state.targetLane = bestLane;
            state.playerLane = bestLane;
            setDodges(d => d + 1);
            setAiStatusMessage(`Hazard detected at 60m. Vector evasive switch to Lane ${bestLane + 1}`);
            if (onActionTrigger) onActionTrigger(`EVASIVE_LANE_${bestLane + 1}`);
            if (soundEnabled) playNitroSound();
          }
        } else {
          // Free lane, optimize for center lane
          if (Math.random() < 0.01 && state.playerLane !== 2) {
            const centerOccupied = state.traffic.some(t => t.lane === 2 && t.y > 50 && t.y < 300);
            if (!centerOccupied) {
              state.playerLane = 2;
              state.targetLane = 2;
            }
          }
        }
      }

      // Update player position smoothly
      const targetX = lanes[state.playerLane];
      state.playerX += (targetX - state.playerX) * 0.2;

      // Update road animation offset
      state.roadOffset = (state.roadOffset + 12) % 60;
      setDistanceTraveled(d => d + 1);

      // Update traffic
      for (let i = state.traffic.length - 1; i >= 0; i--) {
        const car = state.traffic[i];
        car.y += car.speed + 4;

        // Collision check
        if (
          Math.abs(car.y - 250) < 32 &&
          Math.abs(car.x - state.playerX) < 32
        ) {
          // Crash!
          setCrashes(c => c + 1);
          if (soundEnabled) playHazardAlert();
          state.traffic.splice(i, 1);
          setAiStatusMessage('Collision detected! AI recalibrating safety margin.');
          continue;
        }

        if (car.y > canvas.height + 40) {
          state.traffic.splice(i, 1);
        }
      }

      // 3. RENDER CYBER SPEEDWAY
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Road background (Dark asphalt with cyber grids)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Perspective Highway Track
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(80, 0, 420, canvas.height);

      // Road borders with neon cyan glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(80, canvas.height);
      ctx.moveTo(500, 0);
      ctx.lineTo(500, canvas.height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Lane dividers (Dashed lines moving)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -state.roadOffset;

      [170, 250, 330, 410].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Autopilot Predictive Raycast overlay
      if (autopilotActive) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(state.playerX, 240);
        ctx.lineTo(state.playerX, 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(state.playerX - 25, 20, 50, 220);
      }

      // Render Traffic
      state.traffic.forEach(car => {
        // Car shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(car.x - 18, car.y - 25, 36, 50);

        // Car body
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x - 16, car.y - 24, 32, 48);

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(car.x - 12, car.y - 12, 24, 14);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(car.x - 14, car.y + 18, 6, 4);
        ctx.fillRect(car.x + 8, car.y + 18, 6, 4);
      });

      // Render Player Vehicle (Futuristic Cyber Interceptor)
      const px = state.playerX;
      const py = 250;

      // Glow thrusters
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 14, py + 22, 8, 10 + Math.random() * 4);
      ctx.fillRect(px + 6, py + 22, 8, 10 + Math.random() * 4);
      ctx.shadowBlur = 0;

      // Chassis
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - 18, py - 24, 36, 46);

      // Cockpit Canopy
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 10, py - 14, 20, 18);

      // AI Core Indicator
      ctx.fillStyle = autopilotActive ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autopilotActive, soundEnabled, onActionTrigger]);

  const handleManualLane = (dir: 'left' | 'right') => {
    if (autopilotActive) return;
    const state = gameStateRef.current;
    if (dir === 'left' && state.playerLane > 0) {
      state.playerLane--;
    } else if (dir === 'right' && state.playerLane < 4) {
      state.playerLane++;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Cyber Speedway Autopilot Benchmark</h2>
              <span className="text-xs text-cyan-400 font-mono">220 MPH</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Dodges {dodges}</span>
              <span aria-hidden="true">·</span>
              <span>Crashes {crashes}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Distance {(distanceTraveled * 0.1).toFixed(0)}m</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutopilotActive(!autopilotActive)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              autopilotActive
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{autopilotActive ? 'Autopilot Active' : 'Manual Steering'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative w-full bg-slate-950 flex items-center justify-center p-3">
        <canvas
          ref={canvasRef}
          width={580}
          height={340}
          className="w-full max-w-[580px] h-[320px] rounded-lg border border-slate-800 shadow-inner block"
        />

        {!autopilotActive && (
          <div className="absolute bottom-6 flex items-center gap-4">
            <button
              onClick={() => handleManualLane('left')}
              className="px-4 py-2 rounded-xl bg-slate-800/90 text-white font-bold border border-slate-700 active:bg-cyan-500"
            >
              ← Steer Left (A)
            </button>
            <button
              onClick={() => handleManualLane('right')}
              className="px-4 py-2 rounded-xl bg-slate-800/90 text-white font-bold border border-slate-700 active:bg-cyan-500"
            >
              Steer Right (D) →
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase text-[11px]">Radar:</span>
          <span className="text-emerald-400">{aiStatusMessage}</span>
        </div>
        <div className="text-slate-400">
          Reaction: <strong className="text-white">12ms</strong>
        </div>
      </div>
    </div>
  );
}
