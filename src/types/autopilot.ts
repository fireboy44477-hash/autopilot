export type GameProfileId = 
  | 'roblox_obby'
  | 'roblox_fps'
  | 'roblox_bedwars'
  | 'cyber_racing'
  | 'generic_action';

export interface GameProfile {
  id: GameProfileId;
  name: string;
  gameCategory: string;
  description: string;
  defaultReflexMs: number;
  keyBindings: string[];
  recommendedStrategy: string;
}

export type AutopilotMode = 'full_auto' | 'copilot_assist' | 'manual';

export interface ActionCommand {
  id: string;
  key: string;
  label: string;
  action: string;
  delayMs?: number;
  durationMs: number;
  timestamp: number;
  category: 'movement' | 'jump' | 'combat' | 'special';
}

export interface ThreatItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  location: string;
}

export interface InGameInstruction {
  id: string;
  stage: number;
  instructionText: string;
  actionType: 'movement' | 'jump' | 'interact' | 'collect' | 'hazard_dodge' | 'finish';
  targetLocation?: string;
  completed: boolean;
  timestamp: number;
}

export interface AutonomousGameState {
  currentStage: number;
  totalStages: number;
  activeInstruction: InGameInstruction | null;
  completedInstructionsCount: number;
  totalInstructionsCount: number;
  gameCompletionPercent: number;
  status: 'initializing' | 'running_autonomous' | 'recovering' | 'game_completed';
  gameCompletedAt?: number;
}

export interface VisionAnalysisResult {
  detectedGameType?: string;
  confidenceScore?: number;
  primaryThreat?: string;
  safeVector?: string;
  recommendedAction?: string;
  actionQueue?: ActionCommand[];
  threats?: ThreatItem[];
  parsedInGameInstruction?: string;
  nextObjective?: string;
  strategicAdvice?: string;
  timestamp?: number;
  status?: string;
}

export interface TelemetryStats {
  fps: number;
  frameProcessingMs: number;
  aiDecisionsPerMin: number;
  latencyMs: number;
  accuracyScore: number;
  totalCommandsExecuted: number;
  instructionsFollowed: number;
}
