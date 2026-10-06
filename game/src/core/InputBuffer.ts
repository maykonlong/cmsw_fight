export interface BufferedInput {
    direction: string; // e.g., '5' (neutral), '2' (down), '6' (forward), '236', etc. Usually just single numpad direction per frame.
    buttons: string[]; // e.g., ['LP', 'LK']
    frame: number;
}

export class InputBuffer {
    private buffer: BufferedInput[] = [];

    public push(input: BufferedInput): void {
        this.buffer.push(input);
        
        // Descartar entradas com mais de 60 frames de diferença da atual
        // Assumindo que input.frame é o frame atual do jogo
        const currentFrame = input.frame;
        this.buffer = this.buffer.filter(b => currentFrame - b.frame <= 60);
    }

    // Retorna as entradas dos últimos N frames
    public getWindow(frames: number, currentFrame: number): BufferedInput[] {
        return this.buffer.filter(b => currentFrame - b.frame <= frames);
    }

    public clear(): void {
        this.buffer = [];
    }
    
    // Utilitário para ver os inputs brutos
    public getBuffer(): BufferedInput[] {
        return this.buffer;
    }
}

