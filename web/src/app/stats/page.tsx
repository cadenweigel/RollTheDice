'use client'

import { useEffect, useState } from 'react'
import { PairDistribution3D } from '@/components/PairDistribution3D'

interface Stats {
  totalScoreAllTime: number
  totalGames: number
  averageScorePerGame: number
  sumDistribution: number[]
  pairDistribution: number[][]
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <main className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading stats...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="text-red-500">Error: {error}</div>
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="p-8">
        <div>No stats available</div>
      </main>
    )
  }

  const maxSumCount = Math.max(...stats.sumDistribution.slice(2))
  const maxPairCount = Math.max(...stats.pairDistribution.flat())

  // Debug logging
  console.log('Stats data:', stats)
  console.log('Sum distribution:', stats.sumDistribution.slice(2))
  console.log('Max sum count:', maxSumCount)

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Game Statistics</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Score All Time</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalScoreAllTime.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Games</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalGames.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Score per Game</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.averageScorePerGame.toFixed(1)}</p>
        </div>
      </div>

      {/* Sum Distribution Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-12">
        <h2 className="text-xl font-semibold text-black mb-6">Sum Distribution (2-12)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Shows how many times each possible dice sum occurred across all completed games.
        </p>
        <div className="flex items-end justify-between h-64 px-4 pb-4 border-b border-l border-gray-200">
          {stats.sumDistribution.slice(2).map((count, index) => {
            const sum = index + 2
            // Calculate height in pixels instead of percentages for more reliable display
            let heightPx
            if (maxSumCount > 0) {
              heightPx = Math.max((count / maxSumCount) * 200, 20) // Minimum 20px height
            } else if (count > 0) {
              heightPx = 40 // If we have data but no max, use 40px height
            } else {
              heightPx = 20 // Default minimum height
            }
            
            return (
              <div key={sum} className="flex flex-col items-center">
                <div 
                  className="w-10 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:bg-gradient-to-t hover:from-blue-700 hover:to-blue-500 cursor-pointer shadow-md"
                  style={{ height: `${heightPx}px` }}
                  title={`Sum ${sum}: ${count} rolls`}
                />
                <div className="text-sm text-gray-700 mt-2 font-semibold">{sum}</div>
                <div className="text-xs text-gray-500 font-medium">{count}</div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-center text-sm text-gray-600">
          <span className="font-medium">Total Rolls:</span> {stats.sumDistribution.slice(2).reduce((a, b) => a + b, 0)}
        </div>
        {maxSumCount === 0 && (
          <div className="mt-2 text-center text-sm text-amber-600">
            No roll data available yet. Complete a game to see the distribution!
          </div>
        )}
      </div>

      {/* 3D Pair Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-black mb-6">Dice Pair Distribution (Order Matters)</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Each column represents a specific dice combination where <strong>Die A × Die B</strong> shows the order.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>X-axis:</strong> Die A values (1-6) | <strong>Z-axis:</strong> Die B values (1-6)
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Column height:</strong> Number of times that specific combination occurred
          </p>
          <p className="text-sm text-gray-600">
            <strong>Total combinations:</strong> {stats.pairDistribution.flat().reduce((a, b) => a + b, 0)} rolls
          </p>
        </div>
        <div className="h-96 w-full">
          <PairDistribution3D 
            data={stats.pairDistribution} 
            maxCount={maxPairCount}
          />
        </div>
      </div>
    </main>
  )
} 