declare module '@3d-dice/dice-box' {
  interface DiceBoxConfig {
    assetPath: string;
    theme?: string;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    linearDamping?: number;
    angularDamping?: number;
    shadow?: boolean;
    themeColor?: string;
  }

  interface RollOptions {
    values?: number[];
  }

  class DiceBox {
    constructor(selector: string, config: DiceBoxConfig);
    init(): Promise<void>;
    roll(notation: string, options?: RollOptions): void;
    clear(): void;
    updateConfig(config: Partial<DiceBoxConfig>): void;
  }

  export default DiceBox;
} 