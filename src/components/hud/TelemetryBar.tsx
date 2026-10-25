import React from 'react';
import { Activity, Cpu, Shield, Zap, RefreshCw } from 'lucide-react';
import { TelemetryStats } from '../../types/autopilot';

interface TelemetryBarProps {
  stats: TelemetryStats;
  selectedProfile: string;
}

export function TelemetryBar({ stats, selectedProfile }: TelemetryBarProps) {
  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>ENGINE: OPERATIONAL</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">PROFILE:</span>
            <span className="text-slate-200">{selectedProfile}</span>
          </div>
        </div>

        {/* Right Metric Figures with Tabular Numerals */}
        <div className="flex items-center gap-5 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">FRAME RATE:</span>
            <span className="text-white font-bold tabular-nums">{stats.fps} FPS</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">CYCLE LATENCY:</span>
            <span className="text-sky-400 font-bold tabular-nums">{stats.frameProcessingMs.toFixed(1)} ms</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">PRECISION:</span>
            <span className="text-emerald-400 font-bold tabular-nums">{stats.accuracyScore}%</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">COMMANDS:</span>
            <span className="text-white font-bold tabular-nums">{stats.totalCommandsExecuted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
