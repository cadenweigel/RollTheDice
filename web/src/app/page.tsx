'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import DiceCanvas from "@/components/DiceCanvas";

interface Roll {
  id: string;
  index: number;
  dieA: number;
  dieB: number;
  sum: number;
  createdAt: string;
}

interface Game {
  id: string;
  playerName: string | null;
  totalScore: number;
  rollCount: number;
  completedAt: string | null;
}

// Normalize player names for consistency (same logic as server)
function normalizePlayerName(name: string): string {
  return name
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case each word
    .join(' ')
}

// Validate and sanitize player names (same logic as server)
function validatePlayerName(name: string): string | null {
  // Remove any non-alphabetic characters except spaces and common punctuation
  const sanitized = name
    .replace(/[^a-zA-Z\s\-'\.]/g, '') // Only allow letters, spaces, hyphens, apostrophes, and periods
    .trim()
  
  // Must be at least 1 character and no more than 50
  if (sanitized.length === 0 || sanitized.length > 50) {
    return null
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(sanitized)) {
    return null
  }
  
  return sanitized
}

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // Start a new game
  const startGame = async () => {
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const newGame = await response.json() as Game;
        setGame(newGame);
        setRolls([]);
        setShowNameInput(false);
        setPlayerName("");
        
        // Automatically trigger the first roll
        setTimeout(() => {
          rollDice();
        }, 100); // Small delay to ensure game state is set
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Roll the dice
  const rollDice = async () => {
    if (!game || game.rollCount >= 10 || game.completedAt) return;
    
    setIsRolling(true);
    // Don't make the API call yet - wait for the dice to finish rolling
    // The DiceCanvas will call onRollComplete with the actual results
  };

  // Handle dice roll completion with actual results
  const handleRollComplete = async (result: { dieA: number; dieB: number }) => {
    if (!game) return;
    
    try {
      // Now make the API call with the actual dice results
      const response = await fetch(`/api/game/${game.id}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dieA: result.dieA, 
          dieB: result.dieB 
        }),
      });
      
      if (response.ok) {
        const rollData = await response.json() as Roll;
        
        // Update the game state with the actual dice results
        setRolls(prev => [...prev, rollData]);
        setGame(prev => prev ? { 
          ...prev, 
          rollCount: prev.rollCount + 1, 
          totalScore: prev.totalScore + rollData.sum 
        } : null);
        setIsRolling(false);
      }
    } catch (error) {
      console.error('Failed to record roll:', error);
      setIsRolling(false);
    }
  };

  // Complete the game
  const completeGame = async () => {
    if (!game || !playerName.trim()) return;
    
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/game/${game.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() }),
      });
      
      if (response.ok) {
        const completedGame = await response.json() as Game;
        setGame(completedGame);
        setShowNameInput(false);
      }
    } catch (error) {
      console.error('Failed to complete game:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Check if game is complete
  const isGameComplete = game?.completedAt || (game?.rollCount ?? 0) >= 10;
  const canRoll = game && !isGameComplete && !isRolling;

  // Get normalized name preview and validation
  const normalizedNamePreview = playerName.trim() ? normalizePlayerName(playerName.trim()) : '';
  const isValidName = playerName.trim() ? validatePlayerName(playerName.trim()) !== null : false;
  const validationError = playerName.trim() && !isValidName ? 'Name must contain only letters, spaces, hyphens, apostrophes, and periods (1-50 characters).' : '';

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center mb-1">Roll The Dice</h1>
      
      {/* Game Status */}
      {game && (
        <div className="text-center mb-1">
          <p className="text-lg">
            Rolls: {game.rollCount ?? 0}/10 | Total Score: {game.totalScore ?? 0}
          </p>
          {game.playerName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Player: {game.playerName}
            </p>
          )}
        </div>
      )}

      {/* Dice Canvas */}
      <div className="w-full max-w-2xl mb-1">
        <DiceCanvas 
          isRolling={isRolling}
          lastRoll={rolls.length > 0 ? rolls[rolls.length - 1] : null}
          onRollComplete={handleRollComplete}
        />
      </div>

      {/* Game Controls */}
      <div className="flex flex-col items-center mb-1">
        {!game ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Start New Game
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={rollDice}
              disabled={!canRoll}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
                canRoll 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
            
            {isGameComplete && !game.completedAt && (
              <div className="text-center">
                <p className="text-lg mb-1">Game Complete! Enter your name to save your score.</p>
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your name"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                    <button
                      onClick={completeGame}
                      disabled={!isValidName || isCompleting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {isCompleting ? 'Saving...' : 'Save Score'}
                    </button>
                  </div>
                  {validationError && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-xs">
                      {validationError}
                    </p>
                  )}
                  {playerName.trim() && isValidName && normalizedNamePreview !== playerName.trim() && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Will be saved as: <span className="font-medium">{normalizedNamePreview}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {game.completedAt && (
              <div className="text-center">
                <p className="text-lg text-green-600 mb-1">Game saved! Final score: {game.totalScore}</p>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roll History */}
      {rolls.length > 0 && (
        <div className="w-full max-w-2xl mb-1">
          <h3 className="text-xl font-semibold mb-1 text-center">Roll History</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            {rolls.map((roll, index) => (
              <div key={roll.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Roll {index + 1}</div>
                <div className="text-lg font-bold">{roll.dieA} + {roll.dieB}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">= {roll.sum}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex gap-4 items-center pt-1">
        <Link
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/leaderboard"
        >
          Leaderboard
        </Link>
        <Link
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/stats"
        >
          Stats
        </Link>

      </div>
    </div>
    </div>
  );
}
