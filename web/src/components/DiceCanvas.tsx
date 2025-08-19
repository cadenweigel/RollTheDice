'use client'

import { useEffect, useRef, useState } from 'react'

interface Roll {
  id: string;
  index: number;
  dieA: number;
  dieB: number;
  sum: number;
  createdAt: string;
}

interface DiceCanvasProps {
  isRolling: boolean;
  lastRoll: { dieA: number; dieB: number; } | null;
  rolls: Roll[];
  onRollComplete?: (result: { dieA: number; dieB: number }) => void;
}

export default function DiceCanvas({ isRolling, lastRoll, rolls, onRollComplete }: DiceCanvasProps) {
  const diceContainerRef = useRef<HTMLDivElement>(null)
  const diceBoxRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initDiceBox = async () => {
      try {
        const DiceBox = await import('@3d-dice/dice-box')

        if (!diceContainerRef.current) {
          setError("Container not found")
          return
        }

        const assetPath = "/assets/dice-box/"

        diceBoxRef.current = new DiceBox.default("#dice-container", {
          assetPath: assetPath,
          theme: "default",
          scale: 10.0,
          gravity: 0.5,
          mass: 0.05,
          friction: 0.1,
          restitution: 0.75
        })

        try {
          console.log('Initializing dice-box...')
          const result = diceBoxRef.current.init()
          if (result && typeof result.then === 'function') {
            await result
          }
          console.log('Dice-box initialized successfully')
          
          // Test if dice-box is working
          console.log('DiceBox instance:', diceBoxRef.current)
          console.log('DiceBox methods:', Object.getOwnPropertyNames(diceBoxRef.current))
          
        } catch (initError) {
          console.error("Init error:", initError)
          throw initError
        }

        setIsInitialized(true)
        setError(null)

      } catch (err) {
        console.error("Failed to initialize dice-box:", err)
        setError(`Initialization failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    initDiceBox()
  }, [])

  useEffect(() => {
    if (!diceBoxRef.current || !isRolling) return

    if (isRolling) {
      try {
        console.log('Starting dice roll animation...')
        diceBoxRef.current.clear()
        
        // Set up roll completion callback to get actual dice results
        diceBoxRef.current.onRollComplete = (results: any) => {
          console.log('Roll completed:', results)
          
          if (results && results.length > 0 && results[0].rolls) {
            const rolls = results[0].rolls
            if (rolls && rolls.length >= 2) {
              const dieA = rolls[0].value || rolls[0].roll || 1
              const dieB = rolls[1].value || rolls[1].roll || 1
              console.log('Dice results from animation:', { dieA, dieB })
              if (onRollComplete) {
                onRollComplete({ dieA, dieB })
              }
            }
          }
        }

        // Roll the dice and wait for the callback
        diceBoxRef.current.roll("2d6")

      } catch (err) {
        console.error("Error rolling dice:", err)
        setError("Error rolling dice")
      }
    }
  }, [isRolling, onRollComplete])

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] flex items-center justify-center gap-6">
      {/* Left Side - Theme Selector */}
      <div className="w-48 flex-shrink-0">
        <label htmlFor="theme-select" className="block text-base font-semibold text-gray-900 dark:text-white mb-2">
          Dice Theme
        </label>
        <select
          id="theme-select"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isRolling}
        >
          <option value="default">Default</option>
          <option value="wooden">Wooden</option>
          <option value="stone">Stone</option>
          <option value="rust">Rust</option>
          <option value="smooth">Smooth</option>
          <option value="smooth-pip">Pips</option>
        </select>
      </div>

      {/* Center - Dice Container */}
      <div className="relative">
        <div
          id="dice-container"
          ref={diceContainerRef}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg border-2 border-gray-200"
          style={{
            position: 'relative',
            width: '320px',
            height: '150px',
            minHeight: '150px',
            overflow: 'hidden',
            clipPath: 'inset(0 0 0 0)'
          }}
        />
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="text-gray-600 mb-2">Loading dice...</div>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Roll History */}
      <div className="w-48 flex-shrink-0">
        <h3 className="block text-base font-semibold text-gray-900 dark:text-white mb-2">Roll History</h3>
        <div className="h-96 overflow-y-auto">
          {rolls.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 text-center">
              {rolls.map((roll, index) => (
                <div key={roll.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Roll {index + 1}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{roll.dieA} + {roll.dieB}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">= {roll.sum}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
              No rolls yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 