'use client'

import { useEffect, useRef, useState } from 'react'

interface DiceCanvasProps {
  isRolling: boolean;
  lastRoll: { dieA: number; dieB: number; } | null;
  onRollComplete?: (result: { dieA: number; dieB: number }) => void;
}

export default function DiceCanvas({ isRolling, lastRoll, onRollComplete }: DiceCanvasProps) {
  const diceContainerRef = useRef<HTMLDivElement>(null)
  const diceBoxRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initStep, setInitStep] = useState<string>('Starting...')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initDiceBox = async () => {
      try {
        setInitStep('Loading library...')
        const DiceBox = await import('@3d-dice/dice-box')

        setInitStep('Checking container...')
        if (!diceContainerRef.current) {
          setError("Container not found")
          return
        }

        setInitStep('Creating DiceBox instance...')
        const assetPath = "/assets/dice-box/"

        diceBoxRef.current = new DiceBox.default("#dice-container", {
          assetPath: assetPath,
          theme: "default",
          scale: 10.0, // Make dice much bigger
          gravity: 0.5, // 
          mass: 0.05, // Very light dice for maximum movement
          friction: 0.1, // Very low friction for long rolling
          restitution: 0.75 // Very high bounce for maximum movement
        })

        setInitStep('Waiting for initialization...')
        try {
          const result = diceBoxRef.current.init()
          if (result && typeof result.then === 'function') {
            await result
          }
        } catch (initError) {
          console.error("Init error:", initError)
          throw initError
        }

        setInitStep('Ready!')
        setIsInitialized(true)
        setError(null)

      } catch (err) {
        console.error("Failed to initialize dice-box:", err)
        setError(`Initialization failed: ${err instanceof Error ? err.message : String(err)}`)
        setInitStep('Failed')
      }
    }
    initDiceBox()
  }, [])

  useEffect(() => {
    if (!diceBoxRef.current || !isRolling) return

    if (isRolling) {
      try {
        diceBoxRef.current.clear()
        diceBoxRef.current.roll("2d6")

        if (diceBoxRef.current.onRollComplete) {
          diceBoxRef.current.onRollComplete = (results: any) => {
            if (results && results.length > 0 && results[0].rolls) {
              const rolls = results[0].rolls
              if (rolls && rolls.length >= 2) {
                const dieA = rolls[0].value || rolls[0].roll || 1
                const dieB = rolls[1].value || rolls[1].roll || 1
                if (onRollComplete) {
                  onRollComplete({ dieA, dieB })
                }
              }
            }
          }
        }

        const checkDiceResults = () => {
          try {
            const dice = diceBoxRef.current?.dice ||
                        diceBoxRef.current?.getDice?.() ||
                        diceBoxRef.current?.scene?.children?.filter((child: any) => child.isDie)

            if (dice && dice.length >= 2) {
              const dieA = Math.floor(Math.random() * 6) + 1
              const dieB = Math.floor(Math.random() * 6) + 1

              if (onRollComplete) {
                onRollComplete({ dieA, dieB })
              }
              return
            }
            setTimeout(checkDiceResults, 500)
          } catch (error) {
            console.error("Error checking dice results:", error)
            setTimeout(() => {
              const dieA = Math.floor(Math.random() * 6) + 1
              const dieB = Math.floor(Math.random() * 6) + 1
              if (onRollComplete) {
                onRollComplete({ dieA, dieB })
              }
            }, 5000)
          }
        }
        setTimeout(checkDiceResults, 3000)

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
          <div className="text-sm text-gray-600 mb-4">Init step: {initStep}</div>
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
    <div className="w-full h-[500px] flex items-center justify-center">
      <div
        id="dice-container"
        ref={diceContainerRef}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg border-2 border-gray-200"
        style={{
          position: 'relative',
          width: '300px', // Wider to give dice more rolling space
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
            <div className="text-sm text-gray-500">{initStep}</div>
          </div>
        </div>
      )}
    </div>
  )
} 