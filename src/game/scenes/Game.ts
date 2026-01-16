import { Scene, GameObjects } from 'phaser'

type Player = 'X' | 'O' | null;
type GameState = Player[][];

export class Game extends Scene
{
    private board: GameState = [];
    private currentPlayer: Player = 'X';
    private gameOver: boolean = false;
    private cellSize: number = 150;
    private boardOffsetX: number = 0;
    private boardOffsetY: number = 0;
    private cells: GameObjects.Rectangle[][] = [];
    private statusText!: GameObjects.Text;
    private restartButton!: GameObjects.Text;
    private boardLines: (GameObjects.Line | GameObjects.Graphics)[] = [];
    private symbols: (GameObjects.Graphics | GameObjects.Arc)[] = [];
    private winLine: GameObjects.Graphics | null = null;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Фон
        this.add.image(width / 2, height / 2, 'background');

        // Инициализация игрового поля
        this.initBoard();

        // Позиция доски (центр экрана)
        this.boardOffsetX = width / 2 - (this.cellSize * 1.5);
        this.boardOffsetY = height / 2 - (this.cellSize * 1.5);

        // Создание визуального поля
        this.createBoard();

        // Текст статуса
        this.statusText = this.add.text(width / 2, 100, `Ход игрока: ${this.currentPlayer}`, {
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

    private initBoard(): void {
        this.board = [];
        for (let i = 0; i < 3; i++) {
            this.board[i] = [];
            for (let j = 0; j < 3; j++) {
                this.board[i][j] = null;
            }
        }
    }

    private createBoard(): void {
        const lineWidth = 5;
        const lineColor = 0xffffff;

        // Очистка предыдущих ячеек
        this.cells = [];

        // Создание ячеек и линий
        for (let row = 0; row < 3; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 3; col++) {
                const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
                const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;

                // Создание ячейки (прозрачный прямоугольник для клика)
                const cell = this.add.rectangle(x, y, this.cellSize - 10, this.cellSize - 10, 0x000000, 0)
                    .setInteractive({ useHandCursor: true })
                    .setDepth(5)
                    .on('pointerdown', () => this.handleCellClick(row, col))
                    .on('pointerover', () => {
                        if (!this.gameOver && this.board[row][col] === null) {
                            cell.setFillStyle(0x333333, 0.3);
                        }
                    })
                    .on('pointerout', () => {
                        cell.setFillStyle(0x000000, 0);
                    });

                this.cells[row][col] = cell;
            }
        }

        // Вертикальные линии
        for (let i = 1; i < 3; i++) {
            const x = this.boardOffsetX + i * this.cellSize;
            const graphics = this.add.graphics();
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
            const graphics = this.add.graphics();
            graphics.lineStyle(lineWidth, lineColor, 1);
            graphics.beginPath();
            graphics.moveTo(this.boardOffsetX, y);
            graphics.lineTo(this.boardOffsetX + 3 * this.cellSize, y);
            graphics.strokePath();
            graphics.setDepth(10);
            this.boardLines.push(graphics);
        }
    }

    private handleCellClick(row: number, col: number): void {
        if (this.gameOver || this.board[row][col] !== null) {
            return;
        }

        // Установка символа
        this.board[row][col] = this.currentPlayer;
        this.drawSymbol(row, col, this.currentPlayer);

        // Проверка победы
        const winInfo = this.checkWin(row, col);
        if (winInfo) {
            this.gameOver = true;
            this.statusText.setText(`Игрок ${this.currentPlayer} победил!`);
            this.statusText.setStyle({ color: '#00ff00' });
            this.drawWinLine(winInfo);
            return;
        }

        // Проверка ничьей
        if (this.checkDraw()) {
            this.gameOver = true;
            this.statusText.setText('Ничья!');
            this.statusText.setStyle({ color: '#ffff00' });
            return;
        }

        // Смена игрока
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.statusText.setText(`Ход игрока: ${this.currentPlayer}`);
    }

    private drawSymbol(row: number, col: number, player: Player): void {
        const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
        const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
        const fontSize = this.cellSize * 0.6;

        if (player === 'X') {
            // Рисуем крестик линиями через Graphics
            const offset = fontSize * 0.3;
            const graphics = this.add.graphics();
            graphics.lineStyle(8, 0xff0000, 1);
            graphics.beginPath();
            graphics.moveTo(x - offset, y - offset);
            graphics.lineTo(x + offset, y + offset);
            graphics.moveTo(x + offset, y - offset);
            graphics.lineTo(x - offset, y + offset);
            graphics.strokePath();
            graphics.setDepth(20);
            this.symbols.push(graphics);
        } else if (player === 'O') {
            // Рисуем нолик кругом
            const circle = this.add.circle(x, y, fontSize * 0.3, 0x0000ff, 1)
                .setStrokeStyle(8, 0x0000ff)
                .setDepth(20);
            this.symbols.push(circle);
        }
    }

    private checkWin(row: number, col: number): { type: 'row' | 'col' | 'diag' | 'antiDiag', index: number } | null {
        const player = this.board[row][col];
        if (!player) return null;

        // Проверка строки
        if (this.board[row][0] === player && 
            this.board[row][1] === player && 
            this.board[row][2] === player) {
            return { type: 'row', index: row };
        }

        // Проверка столбца
        if (this.board[0][col] === player && 
            this.board[1][col] === player && 
            this.board[2][col] === player) {
            return { type: 'col', index: col };
        }

        // Проверка главной диагонали
        if (row === col) {
            if (this.board[0][0] === player && 
                this.board[1][1] === player && 
                this.board[2][2] === player) {
                return { type: 'diag', index: 0 };
            }
        }

        // Проверка побочной диагонали
        if (row + col === 2) {
            if (this.board[0][2] === player && 
                this.board[1][1] === player && 
                this.board[2][0] === player) {
                return { type: 'antiDiag', index: 0 };
            }
        }

        return null;
    }

    private drawWinLine(winInfo: { type: 'row' | 'col' | 'diag' | 'antiDiag', index: number }): void {
        // Удаляем предыдущую победную линию, если есть
        if (this.winLine) {
            this.winLine.destroy();
        }

        const lineWidth = 10;
        const lineColor = 0x00ff00; // Зеленый цвет для победной линии
        const graphics = this.add.graphics();
        graphics.lineStyle(lineWidth, lineColor, 1);
        graphics.setDepth(30);

        let x1: number, y1: number, x2: number, y2: number;

        switch (winInfo.type) {
            case 'row':
                // Горизонтальная линия через строку
                const rowY = this.boardOffsetY + winInfo.index * this.cellSize + this.cellSize / 2;
                x1 = this.boardOffsetX + 20;
                y1 = rowY;
                x2 = this.boardOffsetX + 3 * this.cellSize - 20;
                y2 = rowY;
                break;

            case 'col':
                // Вертикальная линия через столбец
                const colX = this.boardOffsetX + winInfo.index * this.cellSize + this.cellSize / 2;
                x1 = colX;
                y1 = this.boardOffsetY + 20;
                x2 = colX;
                y2 = this.boardOffsetY + 3 * this.cellSize - 20;
                break;

            case 'diag':
                // Главная диагональ (слева сверху направо вниз)
                x1 = this.boardOffsetX + 20;
                y1 = this.boardOffsetY + 20;
                x2 = this.boardOffsetX + 3 * this.cellSize - 20;
                y2 = this.boardOffsetY + 3 * this.cellSize - 20;
                break;

            case 'antiDiag':
                // Побочная диагональ (справа сверху налево вниз)
                x1 = this.boardOffsetX + 3 * this.cellSize - 20;
                y1 = this.boardOffsetY + 20;
                x2 = this.boardOffsetX + 20;
                y2 = this.boardOffsetY + 3 * this.cellSize - 20;
                break;
        }

        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();

        this.winLine = graphics;
    }

    private checkDraw(): boolean {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.board[row][col] === null) {
                    return false;
                }
            }
        }
        return true;
    }

    private resetGame(): void {
        // Очистка символов
        this.symbols.forEach(symbol => symbol.destroy());
        this.symbols = [];

        // Очистка ячеек
        this.cells.forEach(row => {
            row.forEach(cell => cell.destroy());
        });
        this.cells = [];

        // Очистка линий сетки
        this.boardLines.forEach(line => line.destroy());
        this.boardLines = [];

        // Очистка победной линии
        if (this.winLine) {
            this.winLine.destroy();
            this.winLine = null;
        }

        // Сброс состояния игры
        this.gameOver = false;
        this.currentPlayer = 'X';
        this.initBoard();

        // Пересоздание доски
        this.createBoard();

        // Обновление текста статуса
        this.statusText.setText(`Ход игрока: ${this.currentPlayer}`);
        this.statusText.setStyle({ color: '#ffffff' });
    }
}
