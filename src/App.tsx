import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Camera, 
  Gamepad2, 
  ShieldCheck, 
  Cpu, 
  Crosshair, 
  Gauge, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight,
  Terminal,
  Bot,
  Settings
} from 'lucide-react';

import { RobloxObbyArena } from './components/simulator/RobloxObbyArena';
import { CyberRacingArena } from './components/simulator/CyberRacingArena';
import { ScreenCaptureStation } from './components/vision/ScreenCaptureStation';
import { AutonomousToolKit } from './components/tools/AutonomousToolKit';
import { PermissionModal } from './components/modals/PermissionModal';
import { BridgeControllerModal } from './components/bridge/BridgeControllerModal';
import { TelemetryBar } from './components/hud/TelemetryBar';
import { GameProfileId, TelemetryStats } from './types/autopilot';

// Generated Asset Paths
const IMG_OBBY_ARENA = '/src/assets/images/roblox_obby_arena_1792908096464.jpg';
const IMG_RACING_ARENA = '/src/assets/images/cyber_racing_arena_1792908097786.jpg';
const IMG_TACTICAL_ARENA = '/src/assets/images/tactical_battle_arena_1792908097936.jpg';

export default function App() {
  // Navigation & Active View
  const [activeTab, setActiveTab] = useState<'obby' | 'toolkit' | 'racing' | 'screen' | 'presets'>('obby');

  // Permission & Stream Management
  const [permissionModalOpen, setPermissionModalOpen] = useState<boolean>(false);
  const [bridgeModalOpen, setBridgeModalOpen] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Active Game Profile
  const [selectedProfile, setSelectedProfile] = useState<GameProfileId>('roblox_obby');

  // Telemetry Stats
  const [telemetry, setTelemetry] = useState<TelemetryStats>({
    fps: 60,
    frameProcessingMs: 7.2,
    aiDecisionsPerMin: 1420,
    latencyMs: 12,
    accuracyScore: 99.8,
    totalCommandsExecuted: 416,
    instructionsFollowed: 18
  });

  // Latest AI Key Event
  const [latestActiveKey, setLatestActiveKey] = useState<string | null>(null);

  // Trigger permission modal on first visit if not yet granted
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('apex_pilot_onboarded');
    if (!hasVisited) {
      setPermissionModalOpen(true);
      sessionStorage.setItem('apex_pilot_onboarded', 'true');
    }
  }, []);

  // Request Screen Share Permission
  const requestScreenCapture = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Screen capture API is not supported on this browser. You can still use the built-in Roblox Obby Adventure and Racing Simulators!');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window'
        } as MediaTrackConstraints,
        audio: false
      });

      setMediaStream(stream);
      setStreamActive(true);
      setPermissionGranted(true);
      setActiveTab('screen');

      stream.getVideoTracks()[0].onended = () => {
        setStreamActive(false);
        setMediaStream(null);
      };
    } catch (err: any) {
      console.warn('Screen permission dismissed:', err?.message || err);
    }
  }, []);

  const handleStopStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }
    setMediaStream(null);
    setStreamActive(false);
  };

  const handleActionTrigger = (action: string) => {
    setTelemetry(prev => ({
      ...prev,
      totalCommandsExecuted: prev.totalCommandsExecuted + 1,
      instructionsFollowed: prev.instructionsFollowed + (action.includes('INTERACT') ? 1 : 0),
      frameProcessingMs: 6 + Math.random() * 3
    }));

    if (action.includes('JUMP')) {
      setLatestActiveKey('Space');
    } else if (action.includes('KEY_E')) {
      setLatestActiveKey('KeyE');
    } else if (action.includes('LEFT') || action.includes('LANE_1')) {
      setLatestActiveKey('KeyA');
    } else if (action.includes('RIGHT') || action.includes('LANE_3')) {
      setLatestActiveKey('KeyD');
    } else {
      setLatestActiveKey('KeyW');
    }

    setTimeout(() => setLatestActiveKey(null), 160);
  };

  const profileNames: Record<GameProfileId, string> = {
    roblox_obby: 'Roblox Obby / Adventure Quest',
    roblox_fps: 'Roblox Arsenal / Rivals Shooter',
    roblox_bedwars: 'Roblox Bedwars / Tactical Arena',
    cyber_racing: 'Cyber Highway Speedway',
    generic_action: 'Universal Game Vision'
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
      {/* 
        TOP BAR CONTRACT:
        Zone 1 Wordmark | Zone 2 4-5 single-line links | Zone 3 1 Primary Action CTA
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            ApexPilot AI
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('obby')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'obby' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Roblox Adventure
          </button>
          <button
            onClick={() => setActiveTab('toolkit')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'toolkit' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Autonomous Tool Suite
          </button>
          <button
            onClick={() => setActiveTab('screen')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'screen' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Live Screen Stream
          </button>
          <button
            onClick={() => setActiveTab('racing')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'racing' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Cyber Speedway
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'presets' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Bridge & Presets
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setPermissionModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Launch Autopilot Tool</span>
          </button>
        </div>
      </header>

      {/* Telemetry Status Bar */}
      <TelemetryBar stats={telemetry} selectedProfile={profileNames[selectedProfile]} />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
              <span className="text-emerald-400 font-semibold">Autonomous Tool Mode</span>
              <span aria-hidden="true">·</span>
              <span>Plays Until Game End</span>
              <span aria-hidden="true">·</span>
              <span>Follows In-Game Instructions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-2xl text-balance">
              Autonomous Roblox Tool & Esport Playthrough Engine
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('obby')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'obby' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roblox Adventure
            </button>
            <button
              onClick={() => setActiveTab('toolkit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'toolkit' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Autonomous Tool Suite
            </button>
            <button
              onClick={() => setActiveTab('screen')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'screen' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Screen Stream
            </button>
            <button
              onClick={() => setActiveTab('racing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'racing' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cyber Racing
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'presets' ? 'bg-sky-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bridge & Presets
            </button>
          </div>
        </div>

        {/* Active Workspace View */}
        <section className="w-full">
          {activeTab === 'obby' && (
            <RobloxObbyArena onActionTrigger={handleActionTrigger} />
          )}

          {activeTab === 'toolkit' && (
            <AutonomousToolKit
              onLaunchArena={() => setActiveTab('obby')}
              onLaunchScreenStream={() => {
                setActiveTab('screen');
                setPermissionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'screen' && (
            <ScreenCaptureStation
              onActionTrigger={handleActionTrigger}
              onRequestPermission={requestScreenCapture}
              stream={mediaStream}
              streamActive={streamActive}
              onStopStream={handleStopStream}
              selectedProfile={profileNames[selectedProfile]}
            />
          )}

          {activeTab === 'racing' && (
            <CyberRacingArena onActionTrigger={handleActionTrigger} />
          )}

          {activeTab === 'presets' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Autopilot Profiles & Tuning Matrix</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select tailored reflex algorithms, timing curves, and strafe heuristics for specific titles
                  </p>
                </div>
                <button
                  onClick={() => setBridgeModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Configure OS Bridge & Gamepad</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(
                  [
                    {
                      id: 'roblox_obby',
                      title: 'Roblox Obby / Adventure Quest',
                      desc: 'A* platform pathfinding, moving obstacle timing, spinning laser avoidance, and quest interaction.',
                      reflex: '60ms Pro Timing',
                      category: 'Platformer / Quest'
                    },
                    {
                      id: 'roblox_fps',
                      title: 'Roblox Arsenal / Rivals FPS',
                      desc: 'Dynamic target centering, trigger reflex synchronization, weapon recoil counter-drift.',
                      reflex: '16ms Inhuman Reflex',
                      category: 'First-Person Shooter'
                    },
                    {
                      id: 'roblox_bedwars',
                      title: 'Roblox Bedwars & Blade Ball',
                      desc: 'Auto-parry vector calculation, projectile deflection timing, bridge building macro sequences.',
                      reflex: '24ms Precision Parry',
                      category: 'Tactical Arena'
                    },
                    {
                      id: 'cyber_racing',
                      title: 'Highway Speedways & Racing',
                      desc: 'Raycast collision avoidance, slipstream drafting, predictive brake point management.',
                      reflex: '12ms Radar Reaction',
                      category: 'Sim / Arcade Racing'
                    },
                    {
                      id: 'generic_action',
                      title: 'Universal 2D/3D Action Games',
                      desc: 'Heuristic optical boundary tracking, hazard edge detection, automatic jump & dodge prompts.',
                      reflex: 'Custom Configurable',
                      category: 'Multi-Genre'
                    }
                  ] as const
                ).map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProfile(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      selectedProfile === item.id
                        ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-sky-400 font-semibold">{item.category}</span>
                        {selectedProfile === item.id && (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1.5">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Reflex: {item.reflex}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Feature Showcase Grid with Generated Visual Assets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Verified Gameplay Benchmarks</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-user autonomous tool benchmarks across platformer, racing, and vision streams
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">60 FPS Hardware-Accelerated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors">
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={IMG_OBBY_ARENA}
                  alt="Roblox Obby Obstacle Parkour Course with AI jump pathing"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Roblox Adventure Quest</span>
                  <span className="text-[10px] font-mono text-emerald-400">STAGE 01-04 (END)</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Autonomous instruction parsing, energy core collection, laser dodging, and switch activation until final victory.
                </p>
                <button
                  onClick={() => setActiveTab('obby')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Run Autonomous Obby</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors">
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={IMG_RACING_ARENA}
                  alt="Cyber high speed racing highway with neon grid and telemetry"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Cyber Speedway</span>
                  <span className="text-[10px] font-mono text-cyan-400">220+ MPH</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Optical lane radar scanning oncoming traffic, evasive lane adjustments, and nitro boost management.
                </p>
                <button
                  onClick={() => setActiveTab('racing')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Launch Racing Simulator</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors">
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={IMG_TACTICAL_ARENA}
                  alt="Esports tactical battle arena with holographic beacons and defense towers"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Live Screen Copilot</span>
                  <span className="text-[10px] font-mono text-emerald-400">GEMINI VISION</span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deep visual assessment using Gemini 3.8 Flash, detecting on-screen text instructions, threats, and macro sequences.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('screen');
                    setPermissionModalOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Connect Screen Stream</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090d16] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>ApexPilot Autonomous Game Tool</span>
            <span aria-hidden="true">·</span>
            <span>Zero-User Autonomous Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setBridgeModalOpen(true)} className="hover:text-slate-300 transition-colors cursor-pointer">
              Platform Bridge
            </button>
            <button onClick={() => setPermissionModalOpen(true)} className="hover:text-slate-300 transition-colors cursor-pointer">
              Permissions
            </button>
            <a href="#top" className="hover:text-slate-300 transition-colors">
              Back to Top
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PermissionModal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onGrantPermission={requestScreenCapture}
        onSelectBuiltInArena={() => {
          setActiveTab('obby');
        }}
      />

      <BridgeControllerModal
        isOpen={bridgeModalOpen}
        onClose={() => setBridgeModalOpen(false)}
        activeKey={latestActiveKey}
      />
    </div>
  );
}
