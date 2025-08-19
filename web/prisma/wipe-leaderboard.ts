import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function wipeLeaderboard() {
  console.log('🗑️  Wiping leaderboard...')
  
  try {
    // Delete all rolls first (due to foreign key constraints)
    const deletedRolls = await prisma.roll.deleteMany()
    console.log(`✅ Deleted ${deletedRolls.count} rolls`)
    
    // Delete all games
    const deletedGames = await prisma.game.deleteMany()
    console.log(`✅ Deleted ${deletedGames.count} games`)
    
    console.log('🎉 Leaderboard completely wiped!')
    console.log('💡 Run "npm run db:seed" to repopulate with sample data')
    
  } catch (error) {
    console.error('❌ Error wiping leaderboard:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the wipe function
wipeLeaderboard() 