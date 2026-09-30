import { CombatScene } from './CombatScene';
import { CharacterLoader } from '../core/CharacterLoader';
import { InputManager } from '../core/InputManager';
import { StageLoader } from '../core/StageLoader';
import { CameraSystem } from '../engine/CameraSystem';
import { VFXManager } from '../engine/VFXManager';
import { HUD } from '../ui/HUD';
import { CombatSystem } from '../engine/CombatSystem';

export class TrainingScene extends CombatScene {
    private debugText!: Phaser.GameObjects.Text;
    private showHitboxes: boolean = false;
    private hitboxGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('TrainingScene');
    }

    init(data: any) {
        super.init(data);
        // We'll replace the key via plugin or just have this class registered as 'TrainingScene'
    }

    create() {
        super.create();

        // Remove match manager round start
        // Accessing private/protected fields is tricky in TS if they are private.
        // I will use `(this as any)` to hack around it since we are extending a scene with private fields.
        const anyThis = this as any;
        
        // Remove match manager logic (dummy it)
        if (anyThis.matchManager) {
            anyThis.matchManager.isMatchActive = () => true;
            anyThis.matchManager.checkWinCondition = () => {}; // Never win
        }

        // Make enemy dummy (remove CPUController)
        anyThis.enemy.inputManager = undefined; // No input

        // Setup debug UI
        this.debugText = this.add.text(10, 100, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#00ff00',
            backgroundColor: '#00000088'
        }).setDepth(1000).setScrollFactor(0);

        this.hitboxGraphics = this.add.graphics().setDepth(999);

        // Keys
        this.input.keyboard?.on('keydown-R', () => {
            anyThis.player.setPosition(280, anyThis.player.y);
            anyThis.enemy.setPosition(this.scale.width - 280, anyThis.enemy.y);
            anyThis.player.hp = anyThis.player.maxHp;
            anyThis.enemy.hp = anyThis.enemy.maxHp;
        });

        this.input.keyboard?.on('keydown-H', () => {
            this.showHitboxes = !this.showHitboxes;
        });
    }

    update() {
        super.update();

        const anyThis = this as any;
        const player = anyThis.player;
        const enemy = anyThis.enemy;

        // Infinite HP
        if (player.hp < player.maxHp) player.hp = player.maxHp;
        if (enemy.hp < enemy.maxHp) enemy.hp = enemy.maxHp;

        // Debug Text
        this.debugText.setText([
            `TRAINING MODE`,
            `P1 State: ${player.stateMachine.currentState.name}`,
            `P2 State: ${enemy.stateMachine.currentState.name}`,
            `[R] Reset Position`,
            `[H] Toggle Hitboxes`
        ]);

        // Draw hitboxes
        this.hitboxGraphics.clear();
        if (this.showHitboxes) {
            // Player
            this.hitboxGraphics.lineStyle(2, 0x00ff00, 1);
            this.hitboxGraphics.strokeRect(player.currentHurtbox.x, player.currentHurtbox.y, player.currentHurtbox.width, player.currentHurtbox.height);
            
            if (player.currentHitbox.active) {
                this.hitboxGraphics.lineStyle(2, 0xff0000, 1);
                this.hitboxGraphics.strokeRect(player.currentHitbox.x, player.currentHitbox.y, player.currentHitbox.width, player.currentHitbox.height);
            }

            this.hitboxGraphics.lineStyle(2, 0x0000ff, 1);
            this.hitboxGraphics.strokeRect(player.pushbox.x, player.pushbox.y, player.pushbox.width, player.pushbox.height);

            // Enemy
            this.hitboxGraphics.lineStyle(2, 0x00ff00, 1);
            this.hitboxGraphics.strokeRect(enemy.currentHurtbox.x, enemy.currentHurtbox.y, enemy.currentHurtbox.width, enemy.currentHurtbox.height);
            
            if (enemy.currentHitbox.active) {
                this.hitboxGraphics.lineStyle(2, 0xff0000, 1);
                this.hitboxGraphics.strokeRect(enemy.currentHitbox.x, enemy.currentHitbox.y, enemy.currentHitbox.width, enemy.currentHitbox.height);
            }

            this.hitboxGraphics.lineStyle(2, 0x0000ff, 1);
            this.hitboxGraphics.strokeRect(enemy.pushbox.x, enemy.pushbox.y, enemy.pushbox.width, enemy.pushbox.height);
        }
    }
}
