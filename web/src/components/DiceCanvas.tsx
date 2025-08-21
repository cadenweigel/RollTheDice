'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

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
  isHighScore?: boolean;
}

// Confetti component for high scores
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      life: number
    }> = []
    
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    
    // Create confetti particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 1
      })
    }
    
    let animationId: number
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.1 // gravity
        particle.life -= 0.01
        
        if (particle.life > 0) {
          ctx.save()
          ctx.globalAlpha = particle.life
          ctx.fillStyle = particle.color
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
          ctx.restore()
        } else {
          particles.splice(index, 1)
        }
      })
      
      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate)
      } else {
        // Clean up canvas when animation is done
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    animate()
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ position: 'fixed', top: 0, left: 0 }}
    />
  )
}

// Mobile haptics helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'double-six' = 'medium') => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      'double-six': [50, 100, 50, 100, 50] // Special pattern for double six
    }
    navigator.vibrate(patterns[type])
  }
}

// Celebration sound effect
const playCelebrationSound = () => {
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create a simple celebration sound (ascending notes)
      const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      const duration = 0.15
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
        }, index * 100)
      })
    } catch (error) {
      console.log('Audio not supported or blocked')
    }
  }
}

export default function DiceCanvas({ isRolling, lastRoll, rolls, onRollComplete, isHighScore }: DiceCanvasProps) {
  const diceContainerRef = useRef<HTMLDivElement>(null)
  const diceBoxRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRestoredDice, setHasRestoredDice] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showDoubleSix, setShowDoubleSix] = useState(false)

  // Show confetti when high score is achieved
  useEffect(() => {
    if (isHighScore && !showConfetti) {
      setShowConfetti(true)
      // Play celebration sound
      playCelebrationSound()
      // Special haptic feedback for high score
      triggerHaptic('heavy')
      // Hide confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isHighScore, showConfetti])

  // Show double six celebration
  useEffect(() => {
    if (rolls.length > 0) {
      const lastRoll = rolls[rolls.length - 1]
      if (lastRoll && lastRoll.dieA === 6 && lastRoll.dieB === 6 && !showDoubleSix) {
        setShowDoubleSix(true)
        // Play special double six sound
        playCelebrationSound()
        // Special haptic for double six
        triggerHaptic('double-six')
        // Hide celebration after 2 seconds
        const timer = setTimeout(() => setShowDoubleSix(false), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [rolls, showDoubleSix])

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
        
        // Trigger haptic feedback when starting roll
        triggerHaptic('medium')
        
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
              
              // Trigger haptic feedback based on roll result
              if (dieA === 6 && dieB === 6) {
                triggerHaptic('double-six') // Special haptic for double 6
              } else if (dieA + dieB >= 10) {
                triggerHaptic('medium') // Good roll
              } else {
                triggerHaptic('light') // Regular roll
              }
              
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
      {/* Confetti overlay for high scores */}
      {showConfetti && <Confetti />}
      
      {/* Double Six Celebration */}
      {showDoubleSix && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-8 py-4 rounded-lg shadow-2xl transform scale-110 animate-bounce">
            <div className="text-center">
              <div className="text-4xl mb-2">🎲🎲</div>
              <div className="text-2xl font-bold">DOUBLE SIX!</div>
              <div className="text-lg">Lucky roll!</div>
            </div>
          </div>
        </div>
      )}
      
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
            rolls.map((roll, index) => {
              const isGoldenRoll = roll.dieA === 6 && roll.dieB === 6
              return (
                <div 
                  key={roll.id} 
                  className={`p-1.5 rounded text-center text-xs transition-all duration-300 ${
                    isGoldenRoll 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg transform scale-105' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className={`mb-0.5 ${
                    isGoldenRoll 
                      ? 'text-yellow-900 font-bold' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className={`font-bold text-sm ${
                    isGoldenRoll 
                      ? 'text-yellow-900' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {roll.dieA}+{roll.dieB}
                  </div>
                  <div className={`${
                    isGoldenRoll 
                      ? 'text-yellow-900 font-bold' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {roll.sum}
                  </div>
                  {isGoldenRoll && (
                    <div className="text-xs text-yellow-900 font-bold mt-1">
                      ✨
                    </div>
                  )}
                </div>
              )
            })
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