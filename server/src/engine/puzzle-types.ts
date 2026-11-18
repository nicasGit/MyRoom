export type Reward = { id: string; label: string };
export type Transform3D = { position: [number,number,number]; rotation: [number,number,number]; scale: [number,number,number] };
export type PuzzleObject = { id: string; view: string; role: 'fixed'|'manipulable'|'interactive'|'decorative' };
export type PuzzleResult<S> = { accepted: boolean; state: S; message: string };
export interface PuzzleModule<C,S,A> {
  type: string;
  schemaVersion: number;
  allowedActions: readonly string[];
  parseConfig(value: unknown): C;
  initialState(config: C): S;
  parseState(value: unknown, config: C): S;
  parseAction(value: unknown): A;
  reduce(config: C, state: S, action: A): PuzzleResult<S>;
  isSolved(config: C, state: S): boolean;
  publicState(config: C, state: S): unknown;
  hints(config: C): readonly string[];
  objects(config: C): readonly PuzzleObject[];
  rewards(config: C): readonly Reward[];
}
export type PuzzleInstanceSpec = { id: string; type: string; schemaVersion: number; config: unknown };
export type AdventureStep = { id:string; title:string; narrative:string; next:string|null } & (
  { kind:'puzzle'; instanceId:string } | { kind:'planned'; puzzleType:string }
);
export type AdventureManifest = {
  schemaVersion:1; id:string; version:string; title:string; description:string;
  players:{min:number;max:number;suggestedNames:string[]}; targetMinutes:number;
  instances:PuzzleInstanceSpec[]; steps:AdventureStep[];
  objects:{instanceId:string;objectId:string;placementKey:string}[];
  victory:{requiredSteps:string[]};
};
export type ProgressEvent = { type:'puzzle-solved'|'reward-added'|'step-changed'; id:string };
export type RuntimeInstance = { id:string;type:string;schemaVersion:number;config:unknown;state:unknown;solved:boolean;hintLevel:number };
export type AdventureSnapshot = {
  testStartStepId?:string;
  schemaVersion:1; adventureId:string;adventureVersion:string;revision:number;
  running:boolean;stepId:string;instances:RuntimeInstance[];inventory:Reward[];
  completedSteps:string[];status:'ready'|'playing'|'pending'|'complete';
};
