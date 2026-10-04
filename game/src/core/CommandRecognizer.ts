import { InputBuffer } from './InputBuffer';

export interface CommandDefinition {
    name: string;
    sequence: string[]; 
    windowFrames: number; 
}

export const SPECIAL_COMMANDS: CommandDefinition[] = [
    { name: '623P', sequence: ['6', '2', '3', 'P'], windowFrames: 25 },
    { name: '236P', sequence: ['2', '3', '6', 'P'], windowFrames: 20 },
    { name: '214K', sequence: ['2', '1', '4', 'K'], windowFrames: 20 },
    { name: 'charge_4_6_P', sequence: ['hold_4', '6', 'P'], windowFrames: 40 }
];

export class CommandRecognizer {
    
    public static checkCommands(buffer: InputBuffer, currentFrame: number, facingLeft: boolean): string | null {
        for (const cmd of SPECIAL_COMMANDS) {
            if (this.matchCommand(cmd, buffer, currentFrame, facingLeft)) {
                return cmd.name;
            }
        }
        return null;
    }

    private static matchCommand(cmd: CommandDefinition, buffer: InputBuffer, currentFrame: number, facingLeft: boolean): boolean {
        const inputs = buffer.getWindow(cmd.windowFrames, currentFrame);
        if (inputs.length === 0) return false;

        let scanIndex = inputs.length - 1;
        let sequenceIndex = cmd.sequence.length - 1;

        // O golpe precisa ser o último evento da sequência.
        const button = cmd.sequence[sequenceIndex];
        if (button === 'P' || button === 'K') {
            while (scanIndex >= 0 && !this.matchesButton(button, inputs[scanIndex].buttons)) scanIndex--;
            if (scanIndex < 0) return false;
            sequenceIndex--;
        }

        // Procura cada direção de trás para frente, ignorando repetições e neutros.
        // Isso permite executar o comando com teclado, analógico ou touch sem exigir
        // uma janela artificial de apenas um frame por direção.
        while (sequenceIndex >= 0 && scanIndex >= 0) {
            const sequenceItem = cmd.sequence[sequenceIndex];

            if (sequenceItem.startsWith('hold_')) {
                const holdDir = this.mapDirection(sequenceItem.split('_')[1], facingLeft);
                let heldFrames = 0;
                while (scanIndex >= 0 && inputs[scanIndex].direction === holdDir) {
                    heldFrames++;
                    scanIndex--;
                }
                if (heldFrames < 20) return false;
                sequenceIndex--;
                continue;
            }

            const expectedDir = this.mapDirection(sequenceItem, facingLeft);
            let matched = false;
            while (scanIndex >= 0) {
                const actualDir = inputs[scanIndex].direction;
                scanIndex--;
                if (actualDir === '5') continue;
                if (actualDir === expectedDir || this.isFuzzyMatch(actualDir, expectedDir)) {
                    matched = true;
                    break;
                }
            }
            if (!matched) return false;
            sequenceIndex--;
        }

        return sequenceIndex < 0;
    }

    private static mapDirection(dir: string, facingLeft: boolean): string {
        if (!facingLeft) return dir;
        const map: {[key:string]: string} = {
            '1': '3', '2': '2', '3': '1',
            '4': '6', '5': '5', '6': '4',
            '7': '9', '8': '8', '9': '7'
        };
        return map[dir] || dir;
    }

    private static matchesButton(type: string, buttons: string[]): boolean {
        if (type === 'P') return buttons.includes('LP') || buttons.includes('MP') || buttons.includes('HP');
        if (type === 'K') return buttons.includes('LK') || buttons.includes('MK') || buttons.includes('HK');
        return false;
    }
    
    private static isFuzzyMatch(actual: string, expected: string): boolean {
        if (expected === '6' && (actual === '3' || actual === '9')) return true;
        if (expected === '4' && (actual === '1' || actual === '7')) return true;
        if (expected === '2' && (actual === '1' || actual === '3')) return true;
        return false;
    }
}
