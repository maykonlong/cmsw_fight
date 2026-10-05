/**
 * IInputProvider — Interface unificada de input.
 * 
 * REGRA CRÍTICA: Tanto InputManager (teclado/gamepad/touch) quanto CPUController (IA)
 * DEVEM implementar esta interface com EXATAMENTE os mesmos nomes de propriedade.
 * O Fighter.ts só conhece esta interface — nunca acessa InputManager ou CPUController diretamente.
 */
export interface IInputProvider {
  // ═══ Direcionais (true enquanto segurado) ═══
  readonly isLeftDown: boolean;
  readonly isRightDown: boolean;
  readonly isUpDown: boolean;
  readonly isDownDown: boolean;

  // ═══ Direcionais (true apenas no frame que apertou) ═══
  readonly isUpJustPressed: boolean;

  // ═══ Ataques (true apenas no frame que apertou) ═══
  readonly isLPJustPressed: boolean;
  readonly isMPJustPressed: boolean;
  readonly isHPJustPressed: boolean;
  readonly isLKJustPressed: boolean;
  readonly isMKJustPressed: boolean;
  readonly isHKJustPressed: boolean;
  readonly isSpecialJustPressed: boolean;

  // ═══ Combinados e Dashes ═══
  readonly isThrowJustPressed: boolean; // LP+LK simultâneo
  readonly isLeftDoubleTapped?: boolean;
  readonly isRightDoubleTapped?: boolean;

  // ═══ Buffer de comandos especiais ═══
  readonly buffer: any;
  readonly currentFrame: number;

  // ═══ Chamado a cada frame ═══
  update(): void;
}
