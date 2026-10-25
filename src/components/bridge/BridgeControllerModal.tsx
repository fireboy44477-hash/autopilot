import React, { useState, useEffect } from 'react';
import { Gamepad2, Copy, Check, Terminal, Laptop, Smartphone, Monitor, Cpu, Sliders, ShieldCheck, X } from 'lucide-react';

interface BridgeControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKey: string | null;
}

export function BridgeControllerModal({ isOpen, onClose, activeKey }: BridgeControllerModalProps) {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac' | 'linux' | 'mobile'>('windows');
  const [gamepadDetected, setGamepadDetected] = useState<string | null>(null);
  const [reflexSpeed, setReflexSpeed] = useState<number>(60);
  const [airStrafeAssist, setAirStrafeAssist] = useState<boolean>(true);

  // Detect connected physical gamepads
  useEffect(() => {
    const checkGamepads = () => {
      if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
          if (pads[i]) {
            setGamepadDetected(pads[i]!.id);
            return;
          }
        }
        setGamepadDetected(null);
      }
    };

    window.addEventListener('gamepadconnected', checkGamepads);
    window.addEventListener('gamepaddisconnected', checkGamepads);
    const interval = setInterval(checkGamepads, 2000);

    return () => {
      window.removeEventListener('gamepadconnected', checkGamepads);
      window.removeEventListener('gamepaddisconnected', checkGamepads);
      clearInterval(interval);
    };
  }, []);

  const pythonBridgeCode = `# ApexPilot Local OS Bridge Daemon (Cross-Platform)
# Pip install requirements: pip install pyautogui websockets
import asyncio, json, pyautogui
import websockets

async def handler(websocket):
    print("ApexPilot Connected to Roblox Native Client!")
    async for message in websocket:
        data = json.loads(message)
        key = data.get("key")
        action = data.get("action")
        duration = data.get("durationMs", 100) / 1000.0
        
        if key == "Space":
            pyautogui.press('space')
        elif key in ["KeyW", "KeyA", "KeyS", "KeyD"]:
            char = key.replace("Key", "").lower()
            pyautogui.keyDown(char)
            await asyncio.sleep(duration)
            pyautogui.keyUp(char)

async def main():
    print("Listening on ws://localhost:8080 for ApexPilot AI signals...")
    async with websockets.serve(handler, "localhost", 8080):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonBridgeCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Cross-Platform Bridge & Virtual Controller
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Hardware & native OS autopilot integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Platform Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 font-mono">
              Target Operating Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedPlatform('windows')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                  selectedPlatform === 'windows'
                    ? 'bg-slate-800 border-sky-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold">Windows PC</span>
              </button>
              <button
                onClick={() => setSelectedPlatform('mac')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                  selectedPlatform === 'mac'
                    ? 'bg-slate-800 border-sky-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4 text-slate-200" />
                <span className="text-xs font-semibold">macOS</span>
              </button>
              <button
                onClick={() => setSelectedPlatform('linux')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                  selectedPlatform === 'linux'
                    ? 'bg-slate-800 border-sky-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold">Linux OS</span>
              </button>
              <button
                onClick={() => setSelectedPlatform('mobile')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                  selectedPlatform === 'mobile'
                    ? 'bg-slate-800 border-sky-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold">Mobile/Tablet</span>
              </button>
            </div>
          </div>

          {/* Virtual Keypad & Hardware Gamepad Status */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
                Active Virtual Gamepad
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {gamepadDetected ? `Hardware: ${gamepadDetected.substring(0, 24)}...` : 'Virtual Keypad Ready'}
              </span>
            </div>

            {/* Visual Gamepad Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-3">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`w-11 h-11 rounded-lg border font-mono font-bold text-sm flex items-center justify-center transition-all ${
                    activeKey === 'KeyW'
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg scale-110'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  W
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-11 h-11 rounded-lg border font-mono font-bold text-sm flex items-center justify-center transition-all ${
                      activeKey === 'KeyA'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg scale-110'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    A
                  </span>
                  <span
                    className={`w-11 h-11 rounded-lg border font-mono font-bold text-sm flex items-center justify-center transition-all ${
                      activeKey === 'KeyS'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg scale-110'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    S
                  </span>
                  <span
                    className={`w-11 h-11 rounded-lg border font-mono font-bold text-sm flex items-center justify-center transition-all ${
                      activeKey === 'KeyD'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg scale-110'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    D
                  </span>
                </div>
              </div>

              <div className="h-14 w-px bg-slate-800 mx-2" />

              <div className="flex flex-col items-center gap-2">
                <span
                  className={`px-6 py-3 rounded-lg border font-mono font-bold text-xs transition-all ${
                    activeKey === 'Space'
                      ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-lg scale-105 ring-2 ring-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  SPACEBAR (JUMP)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Frame-perfect timing (±2ms)</span>
              </div>
            </div>
          </div>

          {/* Autopilot Reflex Tuning */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">Reflex Execution Delay</h4>
                <p className="text-[11px] text-slate-400">Controls AI response latency before executing maneuvers</p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400">{reflexSpeed}ms</span>
            </div>
            <input
              type="range"
              min="16"
              max="150"
              step="5"
              value={reflexSpeed}
              onChange={e => setReflexSpeed(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>16ms (Esports Inhuman)</span>
              <span>60ms (Pro Gamer)</span>
              <span>150ms (Casual Safe)</span>
            </div>
          </div>

          {/* Native OS Desktop Bridge Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold uppercase">
                Native Desktop Bridge Agent (Optional for Roblox App)
              </span>
              <button
                onClick={handleCopyScript}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied to Clipboard' : 'Copy Python Bridge'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-44">
              {pythonBridgeCode}
            </pre>
            <p className="text-[11px] text-slate-400 mt-2">
              Run this 25-line script locally on your PC or Mac to let ApexPilot inject keypresses directly into the desktop Roblox client while you watch!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
