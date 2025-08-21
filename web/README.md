# 🎲 Roll The Dice - Interactive Dice Game

A modern, full-stack web application featuring 3D dice animations, real-time game mechanics, and comprehensive statistics tracking.

## ✨ Features

- **🎯 Interactive 3D Dice Rolling**: Smooth Three.js animations with realistic physics
- **🏆 Game Management**: 10-roll games with score tracking and leaderboards
- **📊 Real-time Statistics**: Comprehensive analytics including pair distribution visualizations
- **🎨 Modern UI/UX**: Responsive design with Tailwind CSS and dark mode support
- **🔒 Security**: Rate limiting, input validation, and secure database operations
- **📱 Mobile Optimized**: Responsive design that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel
- **Validation**: Zod schemas
- **Testing**: Vitest

## 🚀 Live Demo

[Deploy your own instance](#deployment) or check out the live demo (coming soon!)

## 📸 Screenshots

- **Main Game**: Interactive dice rolling interface
- **Leaderboard**: Paginated high scores with player rankings
- **Statistics**: 3D visualizations of dice pair distributions
- **Responsive Design**: Mobile-first approach with touch support

## 🏗️ Architecture

### Frontend Structure
```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Main game interface
│   ├── leaderboard/    # High scores page
│   └── stats/          # Analytics dashboard
├── components/          # Reusable components
│   ├── DiceCanvas.tsx  # 3D dice animation
│   └── PairDistribution3D.tsx # 3D statistics
└── lib/                # Utilities and validation
```

### Backend API
- `POST /api/game` - Create new game
- `POST /api/game/:id/roll` - Roll dice and record results
- `POST /api/game/:id/finish` - Complete game with player name
- `GET /api/leaderboard` - Paginated high scores
- `GET /api/stats` - Game statistics and analytics

### Database Schema
```sql
Game: id, playerName, createdAt, completedAt, totalScore, rollCount
Roll: id, gameId, index, dieA, dieB, sum, createdAt
```

## 🎮 How to Play

1. **Start Game**: Click "Start New Game" to begin
2. **Roll Dice**: Click "Roll Dice" to roll two dice (10 rolls per game)
3. **Track Score**: Watch your running total increase with each roll
4. **Complete Game**: After 10 rolls, enter your name to save your score
5. **Compete**: Check the leaderboard to see how you rank!

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase recommended)

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/roll-the-dice.git
cd roll-the-dice/web

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your database URL

# Set up database
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV="development"
```

## 🚀 Deployment

### Quick Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd web
vercel
```

### Manual Deployment
1. Set up PostgreSQL database (Supabase recommended)
2. Deploy to Vercel with environment variables
3. Run database migrations
4. Seed initial data if needed

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

## 📊 Performance

- **Bundle Size**: Main app ~5.15 kB (108 kB First Load JS)
- **API Response**: <100ms for most operations
- **3D Rendering**: 60fps dice animations
- **Database**: Optimized queries with proper indexing

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse and ensures fair play
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Protection**: Proper API security headers
- **Environment Variables**: No secrets in source code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** for 3D graphics capabilities
- **Prisma** for type-safe database operations
- **Next.js** for the excellent React framework
- **Tailwind CSS** for the utility-first styling approach

## 📞 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Portfolio**: [your-portfolio.com](https://your-portfolio.com)
- **LinkedIn**: [Your Name](https://linkedin.com/in/yourprofile)

---

⭐ **Star this repo if you found it helpful!** ⭐

Built with ❤️ using modern web technologies.
