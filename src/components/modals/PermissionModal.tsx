import React from 'react';
import { Shield, Camera, Gamepad2, Volume2, CheckCircle2, X, Zap } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantPermission: () => void;
  onSelectBuiltInArena: () => void;
}

export function PermissionModal({
  isOpen,
  onClose,
  onGrantPermission,
  onSelectBuiltInArena
}: PermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                ApexPilot Autopilot Authorization
              </h3>
              <p className="text-xs text-slate-400">
                Configure game vision & control permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Permission Items */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            To enable the AI to analyze gameplay like a pro and execute optimal moves, ApexPilot requires access to your game feed. Please confirm the following permissions:
          </p>

          <div className="space-y-3">
            {/* Permission 1: Screen Capture */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-semibold text-white">Screen Capture Access</h4>
                  <span className="text-[10px] font-mono text-sky-400">Required for Live Roblox</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Allows the vision engine to track platform edges, hazard lasers, and enemy positions in real-time.
                </p>
              </div>
            </div>

            {/* Permission 2: Gamepad & Reflex Controls */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-semibold text-white">Gamepad & Input Bridge</h4>
                  <span className="text-[10px] font-mono text-emerald-400">Multi-Platform</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Connects to physical controllers or virtual key injectors to trigger frame-perfect jumps and strafes.
                </p>
              </div>
            </div>

            {/* Permission 3: Audio Reflex Cueing */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-semibold text-white">Reflex Audio Cues</h4>
                  <span className="text-[10px] font-mono text-slate-400">Zero-Latency</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Provides synthetic jump timing beeps and imminent danger alarms for esport-level reaction speed.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure & private: Video streams remain on your device and are never recorded.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onSelectBuiltInArena();
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Play Built-In Arenas First
          </button>
          <button
            onClick={() => {
              onClose();
              onGrantPermission();
            }}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Grant & Start Autopilot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
