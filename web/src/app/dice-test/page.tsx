'use client'

import { useState } from 'react'
import DiceCanvas from '@/components/DiceCanvas'

export default function DiceTestPage() {
  const [isRolling, setIsRolling] = useState(false)
  const [testRoll, setTestRoll] = useState<{ dieA: number; dieB: number } | null>(null)

  const rollTestDice = () => {
    setIsRolling(true)
    
    // Generate random dice values
    const dieA = Math.floor(Math.random() * 6) + 1
    const dieB = Math.floor(Math.random() * 6) + 1
    
    setTestRoll({ dieA, dieB })
    
    // Stop rolling after 1.5 seconds to allow animation to settle
    setTimeout(() => {
      setIsRolling(false)
    }, 1500)
  }

  return (
    <div className="w-full max-w-4xl px-6 flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-center">Dice Animation Test</h1>
      
      <div className="text-center">
        <p className="text-lg mb-4">
          Test the dice animation and face orientation
        </p>
        <button
          onClick={rollTestDice}
          disabled={isRolling}
          className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
            isRolling 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isRolling ? 'Rolling...' : 'Roll Test Dice'}
        </button>
        
        {testRoll && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-lg">
              Last Roll: {testRoll.dieA} + {testRoll.dieB} = {testRoll.dieA + testRoll.dieB}
            </p>
            <p className="text-sm text-gray-600">
              The {testRoll.dieA} and {testRoll.dieB} faces should be facing you when the dice stop
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <DiceCanvas 
          isRolling={isRolling}
          lastRoll={testRoll}
        />
      </div>

      <div className="text-center text-sm text-gray-600 max-w-2xl">
        <p>
          <strong>How it works:</strong> When you roll, the dice will randomly rotate during the rolling phase. 
          After the rolling stops, they will smoothly animate to show the correct face (with the rolled value) 
          facing the camera.
        </p>
        <p className="mt-2">
          <strong>Face mapping:</strong> Each die face is mapped to show a specific value. The animation ensures 
          that when the dice settle, the face showing the rolled value is oriented toward the user.
        </p>
      </div>
    </div>
  )
} 