import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.roll.deleteMany()
  await prisma.game.deleteMany()

  // Create sample games with different scores and completion times
  const sampleGames = [
    {
      playerName: 'Alice',
      totalScore: 85,
      rollCount: 10,
      completedAt: new Date('2024-01-15T10:00:00Z'),
      rolls: generateRolls(85)
    },
    {
      playerName: 'Bob',
      totalScore: 85, // Same score as Alice, but completed later
      rollCount: 10,
      completedAt: new Date('2024-01-15T11:00:00Z'),
      rolls: generateRolls(85)
    },
    {
      playerName: 'Charlie',
      totalScore: 92,
      rollCount: 10,
      completedAt: new Date('2024-01-14T15:30:00Z'),
      rolls: generateRolls(92)
    },
    {
      playerName: 'Diana',
      totalScore: 78,
      rollCount: 10,
      completedAt: new Date('2024-01-16T09:15:00Z'),
      rolls: generateRolls(78)
    },
    {
      playerName: 'Eve',
      totalScore: 88,
      rollCount: 10,
      completedAt: new Date('2024-01-13T14:20:00Z'),
      rolls: generateRolls(88)
    },
    {
      playerName: 'Frank',
      totalScore: 91,
      rollCount: 10,
      completedAt: new Date('2024-01-12T16:45:00Z'),
      rolls: generateRolls(91)
    },
    {
      playerName: 'Grace',
      totalScore: 87,
      rollCount: 10,
      completedAt: new Date('2024-01-14T11:10:00Z'),
      rolls: generateRolls(87)
    },
    {
      playerName: 'Henry',
      totalScore: 89,
      rollCount: 10,
      completedAt: new Date('2024-01-11T13:25:00Z'),
      rolls: generateRolls(89)
    },
    {
      playerName: 'Ivy',
      totalScore: 86,
      rollCount: 10,
      completedAt: new Date('2024-01-15T08:30:00Z'),
      rolls: generateRolls(86)
    },
    {
      playerName: 'Jack',
      totalScore: 90,
      rollCount: 10,
      completedAt: new Date('2024-01-10T12:00:00Z'),
      rolls: generateRolls(90)
    }
  ]

  for (const gameData of sampleGames) {
    const { rolls, ...gameInfo } = gameData
    
    const game = await prisma.game.create({
      data: {
        ...gameInfo,
        rolls: {
          create: rolls.map((roll, index) => ({
            index,
            dieA: roll.dieA,
            dieB: roll.dieB,
            sum: roll.sum
          }))
        }
      }
    })
    
    console.log(`✅ Created game for ${game.playerName} with score ${game.totalScore}`)
  }

  console.log('🎉 Seeding completed!')
}

function generateRolls(targetScore: number): Array<{ dieA: number; dieB: number; sum: number }> {
  const rolls: Array<{ dieA: number; dieB: number; sum: number }> = []
  let remainingScore = targetScore
  
  // Generate 9 random rolls first
  for (let i = 0; i < 9; i++) {
    const dieA = Math.floor(Math.random() * 6) + 1
    const dieB = Math.floor(Math.random() * 6) + 1
    const sum = dieA + dieB
    rolls.push({ dieA, dieB, sum })
    remainingScore -= sum
  }
  
  // Last roll to reach target score
  if (remainingScore >= 2 && remainingScore <= 12) {
    // Find valid dice that sum to remaining score
    for (let dieA = 1; dieA <= 6; dieA++) {
      const dieB = remainingScore - dieA
      if (dieB >= 1 && dieB <= 6) {
        rolls.push({ dieA, dieB, sum: remainingScore })
        break
      }
    }
  } else {
    // Fallback: random roll
    const dieA = Math.floor(Math.random() * 6) + 1
    const dieB = Math.floor(Math.random() * 6) + 1
    rolls.push({ dieA, dieB, sum: dieA + dieB })
  }
  
  return rolls
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 