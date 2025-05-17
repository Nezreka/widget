// src/components/MinesweeperWidget.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';

// --- Interfaces & Types ---
type CellState = 'hidden' | 'revealed' | 'flagged' | 'question';
interface Cell {
  isMine: boolean;
  adjacentMines: number;
  state: CellState;
}
type Board = Cell[][];

export interface MinesweeperWidgetSettings {
  difficulty?: 'easy' | 'medium' | 'hard';
  rows?: number; // For custom difficulty
  cols?: number; // For custom difficulty
  mines?: number; // For custom difficulty
}

interface MinesweeperWidgetProps {
  settings?: MinesweeperWidgetSettings;
  id: string;
}

// --- Game Constants ---
const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

// --- Helper Functions ---
const generateEmptyBoard = (rows: number, cols: number): Board => {
  return Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({
      isMine: false,
      adjacentMines: 0,
      state: 'hidden',
    }))
  );
};

const plantMines = (board: Board, rows: number, cols: number, mines: number, firstClickRow: number, firstClickCol: number): Board => {
  let minesPlaced = 0;
  const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy

  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    // Don't place a mine on the first clicked cell or its direct neighbors
    const isSafeZone = Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1;

    if (!newBoard[r][c].isMine && !isSafeZone) {
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
  }
  return newBoard;
};

const calculateAdjacentMines = (board: Board, rows: number, cols: number): Board => {
  const newBoard = JSON.parse(JSON.stringify(board));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let mineCount = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
            mineCount++;
          }
        }
      }
      newBoard[r][c].adjacentMines = mineCount;
    }
  }
  return newBoard;
};

// --- Icons ---
const FlagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.823 1.57L17 8.5v1.25a1.25 1.25 0 11-2.5 0V8.5L13 6.07V16.75a1.25 1.25 0 11-2.5 0V6.07L8.5 8.5v7.25a1.25 1.25 0 11-2.5 0V6H3zm10.707 4.707L12 9.414V3.25a.25.25 0 00-.25-.25H6.25a.25.25 0 00-.25.25v10.66l-1.22-.813a.25.25 0 00-.312.027l-.012.017a.25.25 0 00.027.312l2.25 1.5a.25.25 0 00.274 0l6.5-4.333a.25.25 0 00.027-.312l-.012-.017a.25.25 0 00-.312-.027L13 11.414V7.25a.25.25 0 00-.25-.25h-2a.25.25 0 00-.25.25v2.164l-1.293-1.293a.25.25 0 00-.353 0L7.586 9.414 6.293 8.121a.25.25 0 00-.354 0L4.25 9.81V6.25a.25.25 0 00-.25-.25H3a.25.25 0 00-.25.25v10.5a.25.25 0 00.25.25h.5a.25.25 0 00.25-.25V16h.018a.25.25 0 00.232-.328L3.5 15.5v-2.086l1.293 1.293a.25.25 0 00.353 0L6.439 13.414l1.293 1.293a.25.25 0 00.354 0L9.379 13.414l1.293 1.293a.25.25 0 00.353 0L12.318 13.414l1.293 1.293a.25.25 0 00.354 0L15.258 13.414l.007.007a.25.25 0 00.346.007l2.25-1.5a.25.25 0 00.027-.312l-.012-.017a.25.25 0 00-.312-.027L16 12.293V6.25a.25.25 0 00-.25-.25h-2a.25.25 0 00-.25.25v4.457z" clipRule="evenodd" /></svg>;
const MineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-black"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.025 9.157c.014-.015.027-.032.04-.048a.5.5 0 01.69.734c-.014.015-.027.032-.04.048a.5.5 0 01-.69-.734zM9 10.5a.5.5 0 000-1H7.5a.5.5 0 000 1H9zM9.975 9.157A.5.5 0 009.284 9.85c.014.015.027.032.04.048a.5.5 0 00.69-.734c-.013-.015-.026-.032-.04-.048zM12.5 10.5a.5.5 0 000-1H11a.5.5 0 000 1h1.5zM8.064 11.936a.5.5 0 01.69-.734c.014.015.027.032.04.048a.5.5 0 01-.69.734c-.013-.015-.027-.032-.04-.048zM9.936 11.936c-.014-.015-.027-.032-.04-.048a.5.5 0 00-.69.734c.014.015.027.032.04.048a.5.5 0 00.69-.734zM10 12a1 1 0 100-2 1 1 0 000 2zM6.75 7.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>;
const SmileyFaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-yellow-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9.5C7 8.67 7.67 8 8.5 8s1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5zm5 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S14.33 11 13.5 11 12 10.33 12 9.5zm-1.141 3.004a.75.75 0 01.141-.004h2a.75.75 0 010 1.5h-2a.75.75 0 01-.141-1.496z" clipRule="evenodd" /></svg>;
const CoolFaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-yellow-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 7.75a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM8.25 11a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0V11.75a.75.75 0 01.75-.75zm3.5 0a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0V11.75a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const DeadFaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-500"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.39 6.39a.75.75 0 011.06 0l1.5 1.5a.75.75 0 01-1.06 1.06L6.39 7.45a.75.75 0 010-1.06zm5.122 0a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06zM9 11a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0V11.75A.75.75 0 019 11zm6 0a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0V11a.75.75 0 000-.75zM9.25 15.25a.75.75 0 01-.53-1.28l1.25-1.25a.75.75 0 011.06 1.06l-1.25 1.25a.75.75 0 01-.53.22z" /></svg>;


// --- Settings Panel ---
export const MinesweeperSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: MinesweeperWidgetSettings | undefined;
  onSave: (newSettings: MinesweeperWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [difficulty, setDifficulty] = useState(currentSettings?.difficulty || 'easy');

  const handleSave = () => {
    onSave({ difficulty: difficulty as 'easy' | 'medium' | 'hard' });
  };

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={`ms-difficulty-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Difficulty:
        </label>
        <select
          id={`ms-difficulty-${widgetId}`}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as MinesweeperWidgetSettings['difficulty'])}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="easy">Easy ({DIFFICULTIES.easy.rows}x{DIFFICULTIES.easy.cols}, {DIFFICULTIES.easy.mines} mines)</option>
          <option value="medium">Medium ({DIFFICULTIES.medium.rows}x{DIFFICULTIES.medium.cols}, {DIFFICULTIES.medium.mines} mines)</option>
          <option value="hard">Hard ({DIFFICULTIES.hard.rows}x{DIFFICULTIES.hard.cols}, {DIFFICULTIES.hard.mines} mines)</option>
        </select>
      </div>
      <button
        onClick={handleSave}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Settings & Restart
      </button>
    </div>
  );
};

// --- Main MinesweeperWidget Component ---
const MinesweeperWidget: React.FC<MinesweeperWidgetProps> = ({ settings, id }) => {
  const currentDifficultyParams = DIFFICULTIES[settings?.difficulty || 'easy'];
  const { rows, cols, mines: totalMines } = currentDifficultyParams;

  const [board, setBoard] = useState<Board>(() => generateEmptyBoard(rows, cols));
  const [minesRemaining, setMinesRemaining] = useState(totalMines);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback(() => {
    setBoard(generateEmptyBoard(rows, cols));
    setMinesRemaining(totalMines);
    setGameOver(false);
    setGameWon(false);
    setFirstClick(true);
    setTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [rows, cols, totalMines]);

  useEffect(() => {
    resetGame();
  }, [settings?.difficulty, resetGame]);

  useEffect(() => {
    if (!gameOver && !firstClick && !gameWon) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameOver, firstClick, gameWon]);


  const revealCell = (r: number, c: number, currentBoard: Board): Board => {
    let newBoard = JSON.parse(JSON.stringify(currentBoard)); // Deep copy
    const cell = newBoard[r][c];

    if (cell.state !== 'hidden' || gameOver || gameWon) {
      return newBoard;
    }

    if (cell.isMine) {
      setGameOver(true);
      // Reveal all mines
      newBoard = newBoard.map((rowCells: Cell[]) =>
        rowCells.map((cellToCheck: Cell) => {
          if (cellToCheck.isMine) cellToCheck.state = 'revealed';
          return cellToCheck;
        })
      );
      return newBoard;
    }

    cell.state = 'revealed';

    if (cell.adjacentMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].state === 'hidden') {
            newBoard = revealCell(nr, nc, newBoard);
          }
        }
      }
    }
    return newBoard;
  };

  const checkWinCondition = (currentBoard: Board): boolean => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentBoard[r][c];
        if (!cell.isMine && cell.state === 'hidden') {
          return false; // Found a non-mine cell that is still hidden
        }
      }
    }
    return true; // All non-mine cells are revealed
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || gameWon || board[r][c].state === 'flagged') return;

    let currentBoard = board;
    if (firstClick) {
      currentBoard = plantMines(board, rows, cols, totalMines, r, c);
      currentBoard = calculateAdjacentMines(currentBoard, rows, cols);
      setFirstClick(false);
    }

    const newBoard = revealCell(r, c, currentBoard);
    setBoard(newBoard);

    if (checkWinCondition(newBoard) && !newBoard[r][c].isMine) { // Ensure it wasn't a mine click that triggered win check
        setGameWon(true);
        setGameOver(true); // Stop timer, etc.
         // Auto-flag remaining mines on win
        const finalBoard = newBoard.map((rowCells: Cell[]) =>
            rowCells.map((cellToCheck: Cell) => {
            if (cellToCheck.isMine && cellToCheck.state !== 'flagged') {
                cellToCheck.state = 'flagged';
            }
            return cellToCheck;
            })
        );
        setBoard(finalBoard);
        setMinesRemaining(0);
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || gameWon || board[r][c].state === 'revealed') return;

    const newBoard = JSON.parse(JSON.stringify(board));
    const cell = newBoard[r][c];
    let newMinesRemaining = minesRemaining;

    if (cell.state === 'hidden') {
      if (minesRemaining > 0) {
        cell.state = 'flagged';
        newMinesRemaining--;
      }
    } else if (cell.state === 'flagged') {
      cell.state = 'question'; // Optional: cycle to question mark
      newMinesRemaining++;
    } else if (cell.state === 'question') {
      cell.state = 'hidden';
    }
    setMinesRemaining(newMinesRemaining);
    setBoard(newBoard);
  };

  const getCellContent = (cell: Cell) => {
    if (cell.state === 'flagged') return <FlagIcon />;
    if (cell.state === 'question') return <span className="font-bold text-blue-300">?</span>;
    if (cell.state === 'revealed') {
      if (cell.isMine) return <MineIcon />;
      if (cell.adjacentMines > 0) {
        const colors = ['text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 'text-maroon-500', 'text-teal-500', 'text-black', 'text-gray-500'];
        return <span className={`font-bold ${colors[cell.adjacentMines - 1]}`}>{cell.adjacentMines}</span>;
      }
      return '';
    }
    return '';
  };

  const getStatusIcon = () => {
    if (gameWon) return <CoolFaceIcon />;
    if (gameOver && !gameWon) return <DeadFaceIcon />;
    return <SmileyFaceIcon />;
  };
  
  // Dynamic cell size calculation
  const maxCellSize = 32; // Max size in pixels for a cell
  const minCellSize = 16; // Min size
  const widgetPadding = 16 * 2; // approx p-4 on each side
  
  // Calculate available width and height for the board within the widget
  // This needs to be done in a way that respects the widget's current rendered size.
  // For simplicity, we'll use a ref to the board container.
  const boardContainerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(maxCellSize);

  useEffect(() => {
    const calculateCellSize = () => {
      if (boardContainerRef.current) {
        const containerWidth = boardContainerRef.current.offsetWidth;
        const containerHeight = boardContainerRef.current.offsetHeight;
        
        const cellWidth = Math.floor((containerWidth - (cols -1) * 1) / cols); // 1px border between cells
        const cellHeight = Math.floor((containerHeight - (rows -1) * 1) / rows);
        
        setCellSize(Math.max(minCellSize, Math.min(maxCellSize, cellWidth, cellHeight)));
      }
    };
    
    calculateCellSize(); // Initial calculation
    const resizeObserver = new ResizeObserver(calculateCellSize);
    if (boardContainerRef.current) {
        resizeObserver.observe(boardContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();

  }, [rows, cols, boardContainerRef.current]); // Recalculate if rows/cols change (difficulty) or container is available


  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-slate-800 text-primary p-3 space-y-3 select-none">
      {/* Header: Mines Remaining, Reset Button, Timer */}
      <div className="w-full flex justify-between items-center p-2 bg-slate-700 rounded-md shadow">
        <div className="text-lg font-mono font-bold text-red-500 bg-black px-2 py-1 rounded w-16 text-center">
          {String(minesRemaining).padStart(3, '0')}
        </div>
        <button
          onClick={resetGame}
          className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded-md shadow-sm active:shadow-inner transition-all"
          aria-label="Reset game"
        >
          {getStatusIcon()}
        </button>
        <div className="text-lg font-mono font-bold text-red-500 bg-black px-2 py-1 rounded w-16 text-center">
          {String(Math.min(time, 999)).padStart(3, '0')}
        </div>
      </div>

      {/* Game Board */}
      <div ref={boardContainerRef} className="flex-grow w-full flex items-center justify-center overflow-hidden">
        <div
          className="grid border border-slate-600 bg-slate-700 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            gap: '1px',
          }}
          onContextMenu={(e) => e.preventDefault()} // Prevent browser context menu on board
        >
          {board.map((rowCells, r) =>
            rowCells.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleCellRightClick(e, r, c)}
                disabled={gameOver && cell.state !== 'revealed'} // Disable hidden cells on game over
                className={`flex items-center justify-center font-mono transition-colors duration-75
                  ${cell.state === 'hidden' || cell.state === 'question' ? 'bg-slate-500 hover:bg-slate-400 active:bg-slate-600 border border-slate-600 shadow-sm' : ''}
                  ${cell.state === 'revealed' ? (cell.isMine ? 'bg-red-700' : 'bg-slate-600 border border-slate-700') : ''}
                  ${cell.state === 'flagged' ? 'bg-slate-500 hover:bg-slate-400 border border-slate-600' : ''}
                `}
                style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${cellSize * 0.55}px` }}
                aria-label={`Cell ${r},${c} ${cell.state === 'hidden' ? 'hidden' : cell.state}`}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>
      </div>
      {gameOver && (
        <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${gameOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="p-6 bg-slate-800 rounded-lg shadow-xl text-center">
                <h3 className="text-2xl font-bold mb-3">
                    {gameWon ? "🎉 You Won! 🎉" : "💥 Game Over 💥"}
                </h3>
                <p className="mb-4 text-slate-300">
                    {gameWon ? `Cleared all ${totalMines} mines in ${time} seconds!` : "Better luck next time!"}
                </p>
                <button 
                    onClick={resetGame}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold transition-colors"
                >
                    Play Again
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default MinesweeperWidget;
