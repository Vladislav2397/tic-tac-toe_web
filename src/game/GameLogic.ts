export type Player = 'X' | 'O' | null;
export type GameState = Player[][];
export type WinInfo = { type: 'row' | 'col' | 'diag' | 'antiDiag', index: number };

export class GameLogic {
    private board: GameState;
    private currentPlayer: Player;
    private gameOver: boolean;

    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 'X';
        this.gameOver = false;
    }

    private createEmptyBoard(): GameState {
        const board: GameState = [];
        for (let i = 0; i < 3; i++) {
            board[i] = [];
            for (let j = 0; j < 3; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    getBoard(): GameState {
        return this.board;
    }

    getCurrentPlayer(): Player {
        return this.currentPlayer;
    }

    isGameOver(): boolean {
        return this.gameOver;
    }

    makeMove(row: number, col: number): { success: boolean; player?: Player; winInfo?: WinInfo; isDraw?: boolean } {
        if (this.gameOver || this.board[row][col] !== null) {
            return { success: false };
        }

        // Сохраняем игрока, который делает ход
        const player = this.currentPlayer;

        // Установка символа
        this.board[row][col] = player;

        // Проверка победы
        const winInfo = this.checkWin(row, col);
        if (winInfo) {
            this.gameOver = true;
            return { success: true, player, winInfo };
        }

        // Проверка ничьей
        if (this.checkDraw()) {
            this.gameOver = true;
            return { success: true, player, isDraw: true };
        }

        // Смена игрока
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return { success: true, player };
    }

    private checkWin(row: number, col: number): WinInfo | null {
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

    reset(): void {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 'X';
        this.gameOver = false;
    }
}

