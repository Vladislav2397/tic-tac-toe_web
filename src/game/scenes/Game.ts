import { Scene, GameObjects } from 'phaser';
import { GameLogic } from '../GameLogic';
import { BoardRenderer } from '../BoardRenderer';

export class Game extends Scene {
    private gameLogic: GameLogic;
    private boardRenderer: BoardRenderer;
    private cellSize: number = 150;
    private boardOffsetX: number = 0;
    private boardOffsetY: number = 0;
    private statusText!: GameObjects.Text;
    private restartButton!: GameObjects.Text;

    constructor() {
        super('Game');
        this.gameLogic = new GameLogic();
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Фон
        this.add.image(width / 2, height / 2, 'background');

        // Позиция доски (центр экрана)
        this.boardOffsetX = width / 2 - (this.cellSize * 1.5);
        this.boardOffsetY = height / 2 - (this.cellSize * 1.5);

        // Создание рендерера доски
        this.boardRenderer = new BoardRenderer(
            this,
            this.cellSize,
            this.boardOffsetX,
            this.boardOffsetY
        );

        // Создание визуального поля
        this.boardRenderer.createBoard((row, col) => this.handleCellClick(row, col));

        // Текст статуса
        this.statusText = this.add.text(width / 2, 100, `Ход игрока: ${this.gameLogic.getCurrentPlayer()}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Кнопка перезапуска
        this.restartButton = this.add.text(width / 2, height - 80, 'Новая игра', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.resetGame())
        .on('pointerover', () => this.restartButton.setStyle({ color: '#ffffff' }))
        .on('pointerout', () => this.restartButton.setStyle({ color: '#ffff00' }));
    }

    private handleCellClick(row: number, col: number): void {
        if (this.gameLogic.isGameOver()) {
            return;
        }

        const result = this.gameLogic.makeMove(row, col);
        
        if (!result.success || !result.player) {
            return;
        }

        // Отрисовка символа игрока, который сделал ход
        this.boardRenderer.drawSymbol(row, col, result.player);

        // Обработка результата хода
        if (result.winInfo) {
            this.statusText.setText(`Игрок ${result.player} победил!`);
            this.statusText.setStyle({ color: '#00ff00' });
            this.boardRenderer.drawWinLine(result.winInfo);
        } else if (result.isDraw) {
            this.statusText.setText('Ничья!');
            this.statusText.setStyle({ color: '#ffff00' });
        } else {
            this.statusText.setText(`Ход игрока: ${this.gameLogic.getCurrentPlayer()}`);
        }
    }

    private resetGame(): void {
        // Сброс логики игры
        this.gameLogic.reset();

        // Очистка и пересоздание доски
        this.boardRenderer.clearBoard();
        this.boardRenderer.createBoard((row, col) => this.handleCellClick(row, col));

        // Обновление текста статуса
        this.statusText.setText(`Ход игрока: ${this.gameLogic.getCurrentPlayer()}`);
        this.statusText.setStyle({ color: '#ffffff' });
    }
}
