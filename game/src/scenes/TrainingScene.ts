import { CombatScene } from './CombatScene';

export class TrainingScene extends CombatScene {
    private debugText!: Phaser.GameObjects.Text;
    private showHitboxes: boolean = false;
    private hitboxGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('TrainingScene');
    }

    init(data: any) {
        super.init({ ...data, mode: 'training' });
    }

    create() {
        super.create();

        const anyThis = this as any;

        // Setup debug UI
        this.debugText = this.add.text(10, 100, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#00ff00',
            backgroundColor: '#00000088'
        }).setDepth(1000).setScrollFactor(0);

        this.hitboxGraphics = this.add.graphics().setDepth(999);

        // Keys
        const onReset = () => {
            anyThis.player.setPosition(280, anyThis.player.y);
            anyThis.enemy.setPosition(this.scale.width - 280, anyThis.enemy.y);
            anyThis.player.hp = anyThis.player.maxHp;
            anyThis.enemy.hp = anyThis.enemy.maxHp;
        };

        const onHitboxes = () => {
            this.showHitboxes = !this.showHitboxes;
        };
        this.input.keyboard?.on('keydown-R', onReset);
        this.input.keyboard?.on('keydown-H', onHitboxes);
        this.events.once('shutdown', () => {
            this.input.keyboard?.off('keydown-R', onReset);
            this.input.keyboard?.off('keydown-H', onHitboxes);
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
            `P1 State: ${player.stateMachine.state}`,
            `P2 State: ${enemy.stateMachine.state}`,
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
