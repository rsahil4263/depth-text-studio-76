# Technology Stack

## Core Technologies
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **AI/ML**: Hugging Face Transformers for image processing

## Development Tools
- **Linting**: ESLint with TypeScript support
- **Package Manager**: npm (with bun.lockb present)
- **Development Server**: Vite dev server on port 8080

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Package Management
```bash
npm install          # Install dependencies
npm i <package>      # Add new dependency
```

## Build Configuration
- TypeScript with relaxed settings (no strict null checks, allows implicit any)
- Path aliases configured: `@/*` maps to `./src/*`
- Vite configured with React SWC plugin for fast compilation
- Component tagging enabled in development mode via lovable-tagger