# VERITY - Truth Lives in Language

A forensic linguistic deception analysis tool built with Next.js and powered by advanced NLP algorithms.

## Overview

VERITY analyzes text and conversations using 9 forensic linguistic analysis layers to detect potential deception indicators. The system provides detailed reports with confidence scores, flagged sentences, and narrative structure analysis.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Fonts**: Bebas Neue (display), DM Sans (body)
- **API Client**: Axios

## Design System

### Color Palette
- Background: Near-black (#080808, #0f0f0f, #141414)
- Accent: Electric green (#00ff88)
- Alert colors: Red (#ff3b3b), Amber (#ffaa00)
- Text: White to gray scale (#f0f0f0 to #444444)

### Typography
- Display font: Bebas Neue (headings, logo, scores)
- Body font: DM Sans (UI elements, body text)

### Design Direction
Dark, technical, forensic aesthetic — like a CIA analysis terminal meets modern SaaS. Restrained use of accent color on key interactive elements and data points.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 3001 (or configure `NEXT_PUBLIC_API_URL`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Features

### Pages

1. **Landing Page** (`/`)
   - Hero section with animated text
   - Stats bar showing system capabilities
   - Feature cards explaining detection methods
   - Call-to-action sections

2. **How It Works** (`/how-it-works`)
   - Detailed explanation of 9 analysis layers
   - Scoring methodology
   - System limitations and transparency

3. **Analyze** (`/analyze`)
   - Two-panel layout (input/results)
   - Single message and conversation modes
   - Real-time analysis with loading states
   - Detailed results with:
     - Animated score display
     - Confidence intervals
     - Detected indicators with severity levels
     - Narrative structure visualization
     - Flagged sentences
     - Highlighted text analysis

### Components

- **Navbar**: Floating pill-shaped navigation with scroll effects
- **Footer**: System status indicator with animated pulse
- **HighlightedText**: Sentence-level highlighting with severity indicators

## Analysis Layers

1. **Tense Consistency** (25%) - Detects unexplained tense shifts
2. **Agent Deletion** (15%) - Identifies excessive passive voice
3. **Pronoun Consistency** (10%) - Tracks first-person pronoun shifts
4. **Lexical Diversity** (12%) - Measures vocabulary richness
5. **Negation Clustering** (15%) - Spots defensive negation patterns
6. **Narrative Structure** (15%) - Checks for complete story arc
7. **Information Density** (10%) - Analyzes detail distribution
8. **Cognitive Load** (12%) - Detects hedge words and emphasis
9. **Contradiction Detection** (15%) - Flags contradictory claims

## API Integration

The frontend communicates with the backend API via `api-service.ts`:

```typescript
analyzeText(text: string, mode: 'single' | 'conversation'): Promise<ApiResponse>
```

## Development

### Project Structure

```
client/
├── app/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── HighlightedText.tsx
│   ├── analyze/
│   │   └── page.tsx
│   ├── how-it-works/
│   │   └── page.tsx
│   ├── api-service.ts
│   ├── types.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
└── package.json
```

### Key Files

- `app/api-service.ts` - API client for backend communication
- `app/types.ts` - TypeScript interfaces for API responses
- `app/globals.css` - Design system CSS variables and global styles
- `app/layout.tsx` - Root layout with Navbar and Footer

## Building for Production

```bash
npm run build
```

The build process:
- Compiles TypeScript
- Optimizes assets
- Generates static pages where possible
- Creates production-ready bundle

## License

Part of the Lie Detector NLP system.

---

Made with ❤️ by [Tanish Poddar](https://tanisheesh.is-a.dev/)
