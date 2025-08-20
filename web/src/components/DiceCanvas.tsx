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
  const [hasRestoredDice, setHasRestoredDice] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initDiceBox = async () => {
      try {
        console.log('Initializing DiceBox...')
        
        // Import DiceBox dynamically to avoid SSR issues
        const DiceBox = (await import('@3d-dice/dice-box')).default
        
        // Create new DiceBox instance with minimal physics for static display
        diceBoxRef.current = new DiceBox("#dice-container", {
          theme: "default",
          assetPath: "/assets/dice-box/",
          scale: 10.0,
          gravity: 0.5,
          mass: 0.05,
          friction: 0.1,
          restitution: 0.75
        })
        
        await diceBoxRef.current.init()
        console.log('DiceBox initialized successfully')
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize DiceBox:', error)
        setError('Failed to initialize dice')
      }
    }
    initDiceBox()
  }, [])

  // Reset restoration flag when component unmounts/remounts
  useEffect(() => {
    return () => {
      // Reset the flag when component unmounts so it can work again when navigating back
      setHasRestoredDice(false)
    }
  }, [])

  // Re-render dice when rolls change (e.g., after page reload with restored game)
  useEffect(() => {
    // Only run this effect once when first mounting with existing rolls
    if (hasRestoredDice) return
    
    console.log('Rolls effect triggered:', { 
      hasDiceBox: !!diceBoxRef.current, 
      isInitialized, 
      rollsLength: rolls.length 
    })
    
    if (diceBoxRef.current && isInitialized && rolls.length > 0) {
      console.log('Re-rendering dice for restored game with', rolls.length, 'rolls')
      
      // Mark that we've restored the dice so this effect doesn't run again
      setHasRestoredDice(true)
      
      // Show the dice statically without animation
      const lastRoll = rolls[rolls.length - 1]
      if (lastRoll) {
        console.log('Showing restored dice statically:', lastRoll.dieA, '+', lastRoll.dieB)
        
        // Clear any existing dice
        diceBoxRef.current.clear()
        
        // Show dice with values but without triggering roll animation
        setTimeout(() => {
          if (diceBoxRef.current) {
            try {
              // Use roll with values but set callback to empty to prevent animation completion
              diceBoxRef.current.onRollComplete = () => {}
              diceBoxRef.current.roll("2d6", { values: [lastRoll.dieA, lastRoll.dieB] })
            } catch (error) {
              console.error('Error showing restored dice:', error)
            }
          }
        }, 100)
      }
    }
  }, [rolls, isInitialized, hasRestoredDice])

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
    <div className="w-full flex flex-col items-center">
      {/* Dice Container */}
      <div className="relative mb-4">
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

      {/* Roll History */}
      <div className="w-full max-w-2xl">
        <h3 className="text-center text-base font-semibold text-gray-900 dark:text-white mb-2">Roll History</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {rolls.length > 0 ? (
            rolls.map((roll, index) => (
              <div key={roll.id} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-center text-xs">
                <div className="text-gray-600 dark:text-gray-400 mb-0.5">#{index + 1}</div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{roll.dieA}+{roll.dieB}</div>
                <div className="text-blue-600 dark:text-blue-400">{roll.sum}</div>
              </div>
            ))
          ) : (
            <div className="col-span-5 text-center text-gray-500 dark:text-gray-400 text-xs py-3">
              No rolls yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 