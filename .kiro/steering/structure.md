# Project Structure

## Root Level Organization
```
├── src/                 # Source code
├── public/             # Static assets (favicon, robots.txt)
├── .kiro/              # Kiro configuration and steering
└── [config files]     # Various config files
```

## Source Code Structure (`src/`)
```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui components (auto-generated)
│   └── [custom].tsx   # Custom components (e.g., ImageEditor)
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and services
├── pages/             # Route components
├── App.tsx            # Main app component with providers
├── main.tsx           # React app entry point
└── index.css          # Global styles and CSS variables
```

## Architecture Patterns

### Component Organization
- **UI Components**: Located in `src/components/ui/` (managed by shadcn/ui CLI)
- **Custom Components**: Located in `src/components/` root
- **Page Components**: Located in `src/pages/` for route-level components

### Import Conventions
- Use `@/` alias for all internal imports (e.g., `@/components/ui/button`)
- Absolute imports preferred over relative imports
- UI components imported from `@/components/ui/`

### Styling Approach
- Tailwind CSS with CSS variables for theming
- Custom design tokens defined in `tailwind.config.ts`
- Component-specific styles using Tailwind classes
- CSS variables for colors following HSL format

### State Management
- TanStack Query for server state and caching
- React Hook Form for form state
- Local component state with useState/useReducer

### File Naming
- React components: PascalCase (e.g., `ImageEditor.tsx`)
- Hooks: kebab-case with `use-` prefix (e.g., `use-mobile.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Pages: PascalCase (e.g., `Index.tsx`, `NotFound.tsx`)

### Routing Structure
- All routes defined in `App.tsx`
- Page components in `src/pages/`
- Catch-all route (`*`) should always be last for 404 handling