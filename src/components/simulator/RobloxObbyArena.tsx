import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Shield, 
  Cpu, 
  Compass, 
  Flame, 
  Award, 
  Volume2, 
  VolumeX,
  CheckCircle2,
  ListTodo,
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { playJumpCue, playCheckpointChime, playHazardAlert } from '../../utils/audioFeedback';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'moving' | 'laser' | 'checkpoint' | 'finish' | 'switch' | 'gate';
  moveSpeed?: number;
  moveRange?: number;
  initialX?: number;
  checkpointId?: number;
  laserPhaseOffset?: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  type: 'energy_core' | 'key' | 'star';
}

interface InGameStep {
  id: string;
  stage: number;
  instruction: string;
  details: string;
  actionRequired: 'reach_checkpoint' | 'collect_items' | 'avoid_laser' | 'press_switch' | 'reach_finish';
  completed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function RobloxObbyArena({ onActionTrigger }: { onActionTrigger?: (action: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Autonomous Tool States
  const [autopilotActive, setAutopilotActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stageNumber, setStageNumber] = useState<number>(1);
  const [deaths, setDeaths] = useState<number>(0);
  const [speedrunTimer, setSpeedrunTimer] = useState<number>(0);
  const [currentFps, setCurrentFps] = useState<number>(60);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [gameFullyCompleted, setGameFullyCompleted] = useState<boolean>(false);

  // In-Game Instructions List (4 Major Quests to End of Game)
  const [gameInstructions, setGameInstructions] = useState<InGameStep[]>([
    {
      id: 'step_1',
      stage: 1,
      instruction: 'Follow yellow path markers and activate Checkpoint 1',
      details: 'Navigate floating stepping blocks to register safety baseline.',
      actionRequired: 'reach_checkpoint',
      completed: false
    },
    {
      id: 'step_2',
      stage: 2,
      instruction: 'Collect 3 Energy Cores across the moving chasm',
      details: 'Collect all power orbs to disable the reinforced energy barrier.',
      actionRequired: 'collect_items',
      completed: false
    },
    {
      id: 'step_3',
      stage: 3,
      instruction: 'Time air-strafe through the oscillating laser barrier',
      details: 'Wait for laser deactivation cycle and execute frame-perfect jump.',
      actionRequired: 'avoid_laser',
      completed: false
    },
    {
      id: 'step_4',
      stage: 4,
      instruction: 'Interact with Terminal Switch [E] and enter the Victory Gateway',
      details: 'Disarm final gateway lock and complete the entire Roblox adventure.',
      actionRequired: 'reach_finish',
      completed: false
    }
  ]);

  const [activeInstructionIndex, setActiveInstructionIndex] = useState<number>(0);
  const [aiDecisionLog, setAiDecisionLog] = useState<string>('Autonomous tool active. Reading in-game instructions...');

  // Game physics state in ref for 60 FPS loop
  const gameStateRef = useRef({
    player: {
      x: 50,
      y: 280,
      vx: 0,
      vy: 0,
      width: 22,
      height: 36,
      grounded: false,
      facing: 1,
      runFrame: 0,
      currentCheckpoint: { x: 50, y: 280 }
    },
    keys: {
      left: false,
      right: false,
      jump: false,
      interact: false
    },
    platforms: [] as Platform[],
    collectibles: [] as Collectible[],
    switchActivated: false,
    particles: [] as Particle[],
    lastCheckpoint: 0,
    startTime: Date.now(),
    frameCount: 0,
    fpsCalcTime: performance.now()
  });

  // Build the complete multi-stage Roblox adventure
  const buildCourse = useCallback(() => {
    const list: Platform[] = [
      // Starting Area (Stage 1)
      { x: 20, y: 340, width: 100, height: 22, type: 'checkpoint', checkpointId: 0 },
      { x: 160, y: 310, width: 65, height: 18, type: 'standard' },
      { x: 270, y: 280, width: 65, height: 18, type: 'standard' },
      { x: 380, y: 260, width: 70, height: 18, type: 'moving', moveSpeed: 1.5, moveRange: 80, initialX: 380 },
      // Checkpoint 1 (End of Stage 1)
      { x: 520, y: 250, width: 85, height: 22, type: 'checkpoint', checkpointId: 1 },

      // Stage 2: Moving Chasm with Collectible Energy Cores
      { x: 650, y: 230, width: 60, height: 18, type: 'moving', moveSpeed: -1.8, moveRange: 70, initialX: 650 },
      { x: 770, y: 210, width: 65, height: 18, type: 'standard' },
      { x: 880, y: 190, width: 60, height: 18, type: 'moving', moveSpeed: 2.1, moveRange: 80, initialX: 880 },
      // Checkpoint 2 (End of Stage 2)
      { x: 1010, y: 180, width: 85, height: 22, type: 'checkpoint', checkpointId: 2 },

      // Stage 3: Oscillating Laser Hurdles
      { x: 1140, y: 170, width: 95, height: 18, type: 'laser', laserPhaseOffset: 0 },
      { x: 1280, y: 160, width: 60, height: 18, type: 'moving', moveSpeed: -1.7, moveRange: 60, initialX: 1280 },
      { x: 1390, y: 150, width: 95, height: 18, type: 'laser', laserPhaseOffset: 1.5 },
      // Checkpoint 3 & Terminal Switch (Stage 4)
      { x: 1530, y: 140, width: 90, height: 22, type: 'checkpoint', checkpointId: 3 },
      { x: 1660, y: 140, width: 50, height: 18, type: 'switch' },

      // Stage 4: Unlocked Gateway Bridge to Final Victory Portal
      { x: 1760, y: 140, width: 140, height: 20, type: 'gate' },
      { x: 1950, y: 120, width: 130, height: 26, type: 'finish' }
    ];

    const items: Collectible[] = [
      { id: 'c1', x: 675, y: 190, collected: false, type: 'energy_core' },
      { id: 'c2', x: 795, y: 170, collected: false, type: 'energy_core' },
      { id: 'c3', x: 905, y: 150, collected: false, type: 'energy_core' }
    ];

    return { list, items };
  }, []);

  // Initialize course
  const initGame = useCallback(() => {
    const { list, items } = buildCourse();
    const state = gameStateRef.current;
    state.platforms = list;
    state.collectibles = items;
    state.switchActivated = false;
    state.player.x = 50;
    state.player.y = 280;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.currentCheckpoint = { x: 50, y: 280 };
    state.lastCheckpoint = 0;
    setIsVictory(false);
    setGameFullyCompleted(false);
    setActiveInstructionIndex(0);
    setGameInstructions(prev => prev.map(p => ({ ...p, completed: false })));
    setSpeedrunTimer(0);
    setAiDecisionLog('Autonomous tool initialized. Following Stage 1 instruction.');
  }, [buildCourse]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Key listeners for manual mode (if user toggles manual)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (autopilotActive) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameStateRef.current.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') gameStateRef.current.keys.right = true;
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        gameStateRef.current.keys.jump = true;
      }
      if (e.code === 'KeyE') {
        gameStateRef.current.keys.interact = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameStateRef.current.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') gameStateRef.current.keys.right = false;
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        gameStateRef.current.keys.jump = false;
      }
      if (e.code === 'KeyE') {
        gameStateRef.current.keys.interact = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [autopilotActive]);

  // 60 FPS Autonomous Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeAcc = 0;

    const gameLoop = (time: number) => {
      const state = gameStateRef.current;
      const { player, platforms, collectibles, particles, keys } = state;

      // Update FPS counter
      state.frameCount++;
      if (time - state.fpsCalcTime >= 1000) {
        setCurrentFps(state.frameCount);
        state.frameCount = 0;
        state.fpsCalcTime = time;
      }

      timeAcc += 0.03;

      // 1. UPDATE MOVING PLATFORMS
      platforms.forEach(p => {
        if (p.type === 'moving' && p.initialX !== undefined && p.moveRange && p.moveSpeed) {
          p.x = p.initialX + Math.sin(timeAcc * p.moveSpeed) * p.moveRange;
        }
      });

      // 2. AUTONOMOUS INSTRUCTION FOLLOWER ENGINE (ZERO USER CLICKS NEEDED)
      if (autopilotActive && !gameFullyCompleted) {
        keys.left = false;
        keys.right = false;
        keys.jump = false;
        keys.interact = false;

        // Current platform supporting player
        const currentPlat = platforms.find(p => 
          player.x + player.width > p.x && 
          player.x < p.x + p.width && 
          Math.abs((player.y + player.height) - p.y) < 6 &&
          player.grounded
        );

        // Determine current tactical target based on active game instruction
        let targetX = 0;
        let targetY = 0;
        let isSpecialAction = false;

        // Check if uncollected energy cores are ahead
        const nextCore = collectibles.find(c => !c.collected && c.x > player.x - 40);
        
        // Target next platform or terminal switch
        const forwardPlatforms = platforms
          .filter(p => p.x + p.width > player.x + 8)
          .sort((a, b) => a.x - b.x);

        const targetPlat = forwardPlatforms[0];

        // Specific Instruction handling
        if (activeInstructionIndex === 1 && nextCore) {
          // Stage 2: Collecting Energy Cores
          targetX = nextCore.x;
          targetY = nextCore.y;
          setAiDecisionLog(`Following Instruction #2: Pathing to Energy Core (${collectibles.filter(c => c.collected).length}/3)`);
        } else if (activeInstructionIndex === 3 && !state.switchActivated) {
          // Stage 4: Must interact with terminal switch
          const switchPlat = platforms.find(p => p.type === 'switch');
          if (switchPlat) {
            targetX = switchPlat.x + switchPlat.width / 2;
            targetY = switchPlat.y;
            // Near switch? Press [E]
            if (Math.abs(player.x - targetX) < 30) {
              keys.interact = true;
              state.switchActivated = true;
              setAiDecisionLog('Instruction #4: Terminal Switch activated! Lowering Victory Gateway drawbridge.');
              if (onActionTrigger) onActionTrigger('INTERACT_KEY_E');
              if (soundEnabled) playCheckpointChime();
            }
          }
        } else if (targetPlat) {
          targetX = targetPlat.x + targetPlat.width * 0.45;
          targetY = targetPlat.y;
        }

        const distToTarget = targetX - (player.x + player.width / 2);
        const heightDiff = targetY - (player.y + player.height);

        // Moving platform safety check
        let isMovingTargetOptimal = true;
        if (targetPlat && targetPlat.type === 'moving' && targetPlat.moveSpeed) {
          const platVelocity = Math.cos(timeAcc * targetPlat.moveSpeed);
          if (distToTarget > 80 && platVelocity > 0.8) {
            isMovingTargetOptimal = false;
          }
        }

        // Laser obstacle clearance timing
        let isLaserClear = true;
        if (targetPlat && targetPlat.type === 'laser') {
          const offset = targetPlat.laserPhaseOffset || 0;
          const laserPhase = Math.sin(timeAcc * 3 + offset);
          if (laserPhase > 0.1) {
            isLaserClear = false;
            setAiDecisionLog('Hazard scanner: Laser beam active. Holding jump until beam drops.');
          }
        }

        // Steer player toward target
        if (distToTarget > 4) {
          keys.right = true;
          player.facing = 1;
        } else if (distToTarget < -6) {
          keys.left = true;
          player.facing = -1;
        }

        // Autonomous Jump Decision with pro esports precision
        if (player.grounded) {
          const needJumpDist = distToTarget > 35 && distToTarget < 145;
          const needJumpHeight = heightDiff < -15 && distToTarget < 120;
          const atPlatEdge = currentPlat ? (player.x + player.width > currentPlat.x + currentPlat.width - 20) : false;

          if ((needJumpDist || needJumpHeight || atPlatEdge) && isMovingTargetOptimal && isLaserClear) {
            keys.jump = true;
            if (onActionTrigger) onActionTrigger('AUTOPILOT_JUMP');
            if (soundEnabled) playJumpCue();
          }
        } else {
          // In-air strafing
          if (distToTarget > 12) {
            keys.right = true;
          } else if (distToTarget < -8) {
            keys.left = true;
          }
        }
      }

      // 3. PLAYER PHYSICS & MOVEMENT
      const moveSpeed = 3.6;
      if (keys.left) {
        player.vx = -moveSpeed;
        player.facing = -1;
        player.runFrame += 0.2;
      } else if (keys.right) {
        player.vx = moveSpeed;
        player.facing = 1;
        player.runFrame += 0.2;
      } else {
        player.vx *= 0.75;
      }

      // Gravity
      player.vy += 0.42;
      if (player.vy > 9.5) player.vy = 9.5;

      // Jump Impulse
      if (keys.jump && player.grounded) {
        player.vy = -8.3;
        player.grounded = false;
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 1.5,
            life: 1,
            color: '#38bdf8',
            size: 3
          });
        }
      }

      player.x += player.vx;
      player.y += player.vy;
      player.grounded = false;

      // Collectible hit checks
      collectibles.forEach(core => {
        if (!core.collected) {
          const dist = Math.hypot(
            (player.x + player.width / 2) - core.x,
            (player.y + player.height / 2) - core.y
          );
          if (dist < 26) {
            core.collected = true;
            if (soundEnabled) playCheckpointChime();
            // Check if all 3 are collected
            const remaining = collectibles.filter(c => !c.collected).length;
            if (remaining === 0) {
              setGameInstructions(prev => 
                prev.map((step, idx) => idx === 1 ? { ...step, completed: true } : step)
              );
              setActiveInstructionIndex(2);
              setAiDecisionLog('Instruction #2 complete! All 3 Energy Cores secured. Gate unlocked.');
            }
          }
        }
      });

      // Platform collisions
      platforms.forEach(p => {
        // Laser hazard collision check
        if (p.type === 'laser') {
          const offset = p.laserPhaseOffset || 0;
          const laserActive = Math.sin(timeAcc * 3 + offset) > 0.05;
          if (laserActive) {
            const laserY = p.y - 12;
            if (
              player.x + player.width > p.x &&
              player.x < p.x + p.width &&
              player.y + player.height > laserY &&
              player.y < p.y
            ) {
              if (soundEnabled) playHazardAlert();
              respawnPlayer();
              return;
            }
          }
        }

        // Drawbridge Gate (Only collidable/walkable once switch activated)
        if (p.type === 'gate' && !state.switchActivated) {
          return; // Bridge not yet lowered
        }

        // Top landing collision
        if (
          player.x + player.width > p.x &&
          player.x < p.x + p.width &&
          player.y + player.height >= p.y &&
          player.y + player.height <= p.y + 12 &&
          player.vy >= 0
        ) {
          player.y = p.y - player.height;
          player.vy = 0;
          player.grounded = true;

          // Carry with moving platform
          if (p.type === 'moving' && p.moveSpeed && p.moveRange) {
            const deltaX = Math.cos(timeAcc * p.moveSpeed) * p.moveRange * 0.03 * p.moveSpeed;
            player.x += deltaX;
          }

          // Checkpoints & Instruction Progression
          if (p.type === 'checkpoint' && p.checkpointId !== undefined) {
            if (state.lastCheckpoint < p.checkpointId) {
              state.lastCheckpoint = p.checkpointId;
              player.currentCheckpoint = { x: p.x + 20, y: p.y - player.height };
              if (soundEnabled) playCheckpointChime();

              // Mark instructions complete as we reach stages
              if (p.checkpointId === 1) {
                setGameInstructions(prev => 
                  prev.map((step, idx) => idx === 0 ? { ...step, completed: true } : step)
                );
                setActiveInstructionIndex(1);
                setStageNumber(2);
                setAiDecisionLog('Instruction #1 completed! Advance to Stage 2: Collect Energy Cores.');
              } else if (p.checkpointId === 2) {
                setActiveInstructionIndex(2);
                setStageNumber(3);
              } else if (p.checkpointId === 3) {
                setGameInstructions(prev => 
                  prev.map((step, idx) => idx === 2 ? { ...step, completed: true } : step)
                );
                setActiveInstructionIndex(3);
                setStageNumber(4);
                setAiDecisionLog('Instruction #3 completed! Laser hurdles passed. Activating final switch.');
              }
            }
          }

          // FINAL VICTORY GATEWAY - GAME COMPLETED!
          if (p.type === 'finish' && !gameFullyCompleted) {
            setGameFullyCompleted(true);
            setIsVictory(true);
            setGameInstructions(prev => 
              prev.map(step => ({ ...step, completed: true }))
            );
            if (soundEnabled) playCheckpointChime();
            setAiDecisionLog('MISSION 100% COMPLETE! The Autonomous Tool successfully finished the entire game with zero user input.');

            // Fireworks Confetti
            for (let i = 0; i < 50; i++) {
              particles.push({
                x: p.x + p.width / 2,
                y: p.y - 20,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 8 - 2,
                life: 2,
                color: ['#fbbf24', '#38bdf8', '#ec4899', '#10b981', '#a855f7'][Math.floor(Math.random() * 5)],
                size: 6
              });
            }
          }
        }
      });

      // Pit fall detection
      if (player.y > 450) {
        if (soundEnabled) playHazardAlert();
        respawnPlayer();
      }

      function respawnPlayer() {
        setDeaths(d => d + 1);
        player.x = player.currentCheckpoint.x;
        player.y = player.currentCheckpoint.y;
        player.vx = 0;
        player.vy = 0;
        setAiDecisionLog(`Hazard encounter. Auto-recovery initiated: resuming instruction #${activeInstructionIndex + 1}.`);
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.02;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // 4. RENDERING CANVAS (Roblox Sky, Guide Arrows, Blocks, Avatars, Portal)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cameraX = Math.max(0, player.x - 220);

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.55, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stylized Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 10; i++) {
        const cloudX = ((i * 240) - cameraX * 0.2) % (canvas.width + 400) - 50;
        const cloudY = 35 + (i % 3) * 35;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 26, 0, Math.PI * 2);
        ctx.arc(cloudX + 22, cloudY - 10, 32, 0, Math.PI * 2);
        ctx.arc(cloudX + 48, cloudY, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom death void
      const voidGrad = ctx.createLinearGradient(0, canvas.height - 35, 0, canvas.height);
      voidGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      voidGrad.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, canvas.height - 35, canvas.width, 35);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Render In-Game Floating Guide Arrows (Roblox Tutorial Markers)
      const guidePoints = [120, 480, 840, 1220, 1600];
      guidePoints.forEach((gx, idx) => {
        const gy = 180 + Math.sin(timeAcc * 3 + idx) * 8;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 16, gy + 10);
        ctx.lineTo(gx, gy + 20);
        ctx.closePath();
        ctx.fill();
      });

      // Render Tactical AI Path Vector
      if (autopilotActive) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
        const forwardTarget = platforms.find(p => p.x > player.x);
        if (forwardTarget) {
          ctx.lineTo(forwardTarget.x + forwardTarget.width / 2, forwardTarget.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render Platforms
      platforms.forEach(p => {
        // Skip gate if not lowered
        if (p.type === 'gate' && !state.switchActivated) {
          // Draw holographic locked barrier
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y - 40, p.width, 60);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
          ctx.fillRect(p.x, p.y - 40, p.width, 60);
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('GATE LOCKED: ACTIVATE SWITCH', p.x + 8, p.y - 15);
          return;
        }

        // Platform 3D shadow depth
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(p.x + 4, p.y + 4, p.width, p.height);

        // Platform Face colors
        if (p.type === 'checkpoint') {
          const isActivated = state.lastCheckpoint >= (p.checkpointId || 0);
          ctx.fillStyle = isActivated ? '#06b6d4' : '#f59e0b';
        } else if (p.type === 'laser') {
          ctx.fillStyle = '#dc2626';
        } else if (p.type === 'moving') {
          ctx.fillStyle = '#8b5cf6';
        } else if (p.type === 'switch') {
          ctx.fillStyle = state.switchActivated ? '#10b981' : '#f97316';
        } else if (p.type === 'gate') {
          ctx.fillStyle = '#0ea5e9';
        } else if (p.type === 'finish') {
          ctx.fillStyle = '#10b981';
        } else {
          ctx.fillStyle = '#3b82f6';
        }

        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(p.x, p.y, p.width, 4);

        // Stud dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let sx = p.x + 6; sx < p.x + p.width - 6; sx += 18) {
          ctx.beginPath();
          ctx.arc(sx, p.y + 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Switch Terminal Prompt
        if (p.type === 'switch') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(state.switchActivated ? 'SWITCH: ON' : 'PRESS [E]', p.x - 2, p.y - 12);
        }

        // Laser beam
        if (p.type === 'laser') {
          const offset = p.laserPhaseOffset || 0;
          const laserActive = Math.sin(timeAcc * 3 + offset) > 0.05;
          if (laserActive) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 14;
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 12);
            ctx.lineTo(p.x + p.width, p.y - 12);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Victory Gateway
        if (p.type === 'finish') {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText('🏆', p.x + p.width / 2 - 14, p.y - 14);

          // Golden Portal Arch
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.strokeRect(p.x + 10, p.y - 65, p.width - 20, 65);
        }
      });

      // Render Collectible Energy Cores (Glow Orbs)
      collectibles.forEach(core => {
        if (!core.collected) {
          const bobY = core.y + Math.sin(timeAcc * 4) * 4;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(core.x, bobY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner ring
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(core.x, bobY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Particles
      particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Render Character Avatar
      // Head
      ctx.fillStyle = '#fde047';
      ctx.fillRect(player.x + 3, player.y, 16, 12);
      // Face
      ctx.fillStyle = '#0f172a';
      if (player.facing === 1) {
        ctx.fillRect(player.x + 12, player.y + 4, 3, 3);
        ctx.fillRect(player.x + 7, player.y + 4, 3, 3);
      } else {
        ctx.fillRect(player.x + 4, player.y + 4, 3, 3);
        ctx.fillRect(player.x + 9, player.y + 4, 3, 3);
      }
      // Torso
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(player.x + 2, player.y + 12, 18, 14);

      // Autopilot Indicator Badge
      if (autopilotActive) {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(player.x + 8, player.y + 15, 6, 6);
      }

      // Legs
      ctx.fillStyle = '#16a34a';
      const legOffset = Math.sin(player.runFrame * 4) * (player.grounded ? 4 : 0);
      ctx.fillRect(player.x + 2, player.y + 26, 8, 10 + legOffset);
      ctx.fillRect(player.x + 12, player.y + 26, 8, 10 - legOffset);

      // AI Reticle
      if (autopilotActive) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(player.x - 4, player.y - 8, player.width + 8, player.height + 12);
      }

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [autopilotActive, gameFullyCompleted, isVictory, soundEnabled, activeInstructionIndex, onActionTrigger]);

  // Speedrun timer
  useEffect(() => {
    if (gameFullyCompleted) return;
    const timer = setInterval(() => {
      setSpeedrunTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameFullyCompleted]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const completedStepsCount = gameInstructions.filter(i => i.completed).length;
  const progressPercent = Math.round((completedStepsCount / gameInstructions.length) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Arena Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Autonomous Roblox Adventure Tool</h2>
              <span className="text-xs text-emerald-400 font-mono">
                {gameFullyCompleted ? 'ALL OBJECTIVES CLEARED' : `STAGE 0${stageNumber}/04`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>FPS {currentFps}</span>
              <span aria-hidden="true">·</span>
              <span>Deaths {deaths}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Time {formatTimer(speedrunTimer)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-400 font-bold">Progress {progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Autopilot Tool Switch */}
          <button
            onClick={() => setAutopilotActive(!autopilotActive)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              autopilotActive
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{autopilotActive ? 'Tool Active: Zero User' : 'Manual Control'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Restart Entire Game */}
          <button
            onClick={initGame}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            title="Restart Full Game From Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active In-Game Instruction Banner (Followed Automatically) */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded">
            IN-GAME INSTRUCTION:
          </span>
          <span className="text-xs font-semibold text-white truncate">
            {gameFullyCompleted
              ? 'Final Objective Completed: Victory Gateway Reached!'
              : gameInstructions[activeInstructionIndex]?.instruction || 'Following path...'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-400">
            Objectives: <strong className="text-white">{completedStepsCount}/{gameInstructions.length}</strong>
          </span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full bg-slate-950 flex items-center justify-center p-3">
        <canvas
          ref={canvasRef}
          width={840}
          height={380}
          className="w-full max-w-[840px] h-[340px] sm:h-[380px] rounded-lg border border-slate-800 shadow-inner block"
        />

        {/* Victory Modal Overlay when game completes */}
        {gameFullyCompleted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Roblox Game 100% Completed!</h3>
            <p className="text-xs text-slate-300 max-w-md mb-4">
              The autonomous tool played the entire game by itself from start to finish, followed all in-game instructions, collected all energy relics, and unlocked the Victory Gateway with zero user clicks.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mb-5">
              <span>Time: <strong className="text-white">{formatTimer(speedrunTimer)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Deaths: <strong className="text-white">{deaths}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Objectives: <strong className="text-emerald-400">4/4 Cleared</strong></span>
            </div>
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Autonomous Playthrough Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Instruction Progress Checklist & AI Execution Log */}
      <div className="p-5 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: In-Game Instructions Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
            <span>In-Game Quest Instructions</span>
            <span className="text-emerald-400">{progressPercent}% Completed</span>
          </div>

          <div className="space-y-2">
            {gameInstructions.map((step, idx) => (
              <div
                key={step.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                  step.completed
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                    : idx === activeInstructionIndex
                    ? 'bg-sky-950/30 border-sky-600/50 text-white ring-1 ring-sky-500/30'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                        idx === activeInstructionIndex
                          ? 'border-sky-400 text-sky-400 font-bold'
                          : 'border-slate-700 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{step.instruction}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{step.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Autonomous Tool Execution Telemetry */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold uppercase text-slate-400">
                Autonomous Tool Execution Log
              </span>
              <span className="text-[11px] font-mono text-emerald-400">ZERO USER INTERVENTION</span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 min-h-[64px]">
              {aiDecisionLog}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
            <div className="p-2 bg-slate-950/50 rounded border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block">TOOL STATUS</span>
              <span className="text-emerald-400 font-bold">
                {gameFullyCompleted ? 'COMPLETED' : 'PLAYING AUTONOMOUSLY'}
              </span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block">RECOVERY ENGINE</span>
              <span className="text-sky-400 font-bold">AUTO-RESPAWN & RESUME</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
