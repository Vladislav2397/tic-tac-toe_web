import { Scene, GameObjects } from 'phaser';
import { Player, WinInfo } from './GameLogic';

export class BoardRenderer {
    private scene: Scene;
    private cellSize: number;
    private boardOffsetX: number;
    private boardOffsetY: number;
    
    private cells: GameObjects.Rectangle[][] = [];
    private boardLines: GameObjects.Graphics[] = [];
    private symbols: (GameObjects.Graphics | GameObjects.Arc)[] = [];
    private winLine: GameObjects.Graphics | null = null;

    constructor(scene: Scene, cellSize: number, boardOffsetX: number, boardOffsetY: number) {
        this.scene = scene;
        this.cellSize = cellSize;
        this.boardOffsetX = boardOffsetX;
        this.boardOffsetY = boardOffsetY;
    }

    createBoard(onCellClick: (row: number, col: number) => void): void {
        this.clearBoard();
        this.createCells(onCellClick);
        this.createGridLines();
    }

    private createCells(onCellClick: (row: number, col: number) => void): void {
        for (let row = 0; row < 3; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 3; col++) {
                const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
                const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;

                const cell = this.scene.add.rectangle(x, y, this.cellSize - 10, this.cellSize - 10, 0x000000, 0)
                    .setInteractive({ useHandCursor: true })
                    .setDepth(5)
                    .on('pointerdown', () => onCellClick(row, col))
                    .on('pointerover', () => {
                        cell.setFillStyle(0x333333, 0.3);
                    })
                    .on('pointerout', () => {
                        cell.setFillStyle(0x000000, 0);
                    });

                this.cells[row][col] = cell;
            }
        }
    }

    private createGridLines(): void {
        const lineWidth = 5;
        const lineColor = 0xffffff;

        // Вертикальные линии
        for (let i = 1; i < 3; i++) {
            const x = this.boardOffsetX + i * this.cellSize;
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(lineWidth, lineColor, 1);
            graphics.beginPath();
            graphics.moveTo(x, this.boardOffsetY);
            graphics.lineTo(x, this.boardOffsetY + 3 * this.cellSize);
            graphics.strokePath();
            graphics.setDepth(10);
            this.boardLines.push(graphics);
        }

        // Горизонтальные линии
        for (let i = 1; i < 3; i++) {
            const y = this.boardOffsetY + i * this.cellSize;
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(lineWidth, lineColor, 1);
            graphics.beginPath();
            graphics.moveTo(this.boardOffsetX, y);
            graphics.lineTo(this.boardOffsetX + 3 * this.cellSize, y);
            graphics.strokePath();
            graphics.setDepth(10);
            this.boardLines.push(graphics);
        }
    }

    drawSymbol(row: number, col: number, player: Player): void {
        const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
        const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
        const symbolSize = this.cellSize * 0.6;

        if (player === 'X') {
            this.drawX(x, y, symbolSize);
        } else if (player === 'O') {
            this.drawO(x, y, symbolSize);
        }
    }

    private drawX(x: number, y: number, size: number): void {
        const offset = size * 0.3;
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(8, 0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(x - offset, y - offset);
        graphics.lineTo(x + offset, y + offset);
        graphics.moveTo(x + offset, y - offset);
        graphics.lineTo(x - offset, y + offset);
        graphics.strokePath();
        graphics.setDepth(20);
        this.symbols.push(graphics);
    }

    private drawO(x: number, y: number, size: number): void {
        const circle = this.scene.add.circle(x, y, size * 0.3, 0x0000ff, 1)
            .setStrokeStyle(8, 0x0000ff)
            .setDepth(20);
        this.symbols.push(circle);
    }

    drawWinLine(winInfo: WinInfo): void {
        if (this.winLine) {
            this.winLine.destroy();
        }

        const lineWidth = 10;
        const lineColor = 0x00ff00;
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(lineWidth, lineColor, 1);
        graphics.setDepth(30);

        const { x1, y1, x2, y2 } = this.calculateWinLineCoordinates(winInfo);
        
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();

        this.winLine = graphics;
    }

    private calculateWinLineCoordinates(winInfo: WinInfo): { x1: number; y1: number; x2: number; y2: number } {
        const padding = 20;

        switch (winInfo.type) {
            case 'row':
                const rowY = this.boardOffsetY + winInfo.index * this.cellSize + this.cellSize / 2;
                return {
                    x1: this.boardOffsetX + padding,
                    y1: rowY,
                    x2: this.boardOffsetX + 3 * this.cellSize - padding,
                    y2: rowY
                };

            case 'col':
                const colX = this.boardOffsetX + winInfo.index * this.cellSize + this.cellSize / 2;
                return {
                    x1: colX,
                    y1: this.boardOffsetY + padding,
                    x2: colX,
                    y2: this.boardOffsetY + 3 * this.cellSize - padding
                };

            case 'diag':
                return {
                    x1: this.boardOffsetX + padding,
                    y1: this.boardOffsetY + padding,
                    x2: this.boardOffsetX + 3 * this.cellSize - padding,
                    y2: this.boardOffsetY + 3 * this.cellSize - padding
                };

            case 'antiDiag':
                return {
                    x1: this.boardOffsetX + 3 * this.cellSize - padding,
                    y1: this.boardOffsetY + padding,
                    x2: this.boardOffsetX + padding,
                    y2: this.boardOffsetY + 3 * this.cellSize - padding
                };
        }
    }

    updateCellHover(row: number, col: number, isHovered: boolean, canInteract: boolean): void {
        if (!canInteract) return;
        
        const cell = this.cells[row][col];
        if (cell) {
            cell.setFillStyle(isHovered ? 0x333333 : 0x000000, isHovered ? 0.3 : 0);
        }
    }

    clearBoard(): void {
        this.symbols.forEach(symbol => symbol.destroy());
        this.symbols = [];

        this.cells.forEach(row => {
            row.forEach(cell => cell.destroy());
        });
        this.cells = [];

        this.boardLines.forEach(line => line.destroy());
        this.boardLines = [];

        if (this.winLine) {
            this.winLine.destroy();
            this.winLine = null;
        }
    }
}

