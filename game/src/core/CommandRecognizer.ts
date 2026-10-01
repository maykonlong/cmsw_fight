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

        let seqIndex = cmd.sequence.length - 1;
        let pIndex = inputs.length - 1;

        // Achar o frame do botão (P ou K)
        const lastCmdItem = cmd.sequence[seqIndex];
        let foundButton = false;
        
        if (lastCmdItem === 'P' || lastCmdItem === 'K') {
            for (let i = inputs.length - 1; i >= 0; i--) {
                if (this.matchesButton(lastCmdItem, inputs[i].buttons)) {
                    pIndex = i;
                    seqIndex--;
                    foundButton = true;
                    break;
                }
            }
            if (!foundButton) return false;
        }

        // Agora busca as direções para trás
        for (let i = pIndex; i >= 0; i--) {
            if (seqIndex < 0) break;
            const input = inputs[i];
            let seqItem = cmd.sequence[seqIndex];
            
            if (seqItem.startsWith('hold_')) {
                const holdDir = this.mapDirection(seqItem.split('_')[1], facingLeft);
                let holdFramesCount = 0;
                const extendedInputs = buffer.getWindow(100, currentFrame);
                for (let j = i; j >= 0; j--) {
                    if (extendedInputs[j].direction === holdDir) {
                        holdFramesCount++;
                    } else {
                        break;
                    }
                }
                if (holdFramesCount >= 45) {
                    seqIndex--;
                } else {
                    return false;
                }
            } else {
                const expectedDir = this.mapDirection(seqItem, facingLeft);
                if (input.direction === expectedDir || this.isFuzzyMatch(input.direction, expectedDir)) {
                    seqIndex--;
                }
            }
        }
        
        return seqIndex < 0;
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
