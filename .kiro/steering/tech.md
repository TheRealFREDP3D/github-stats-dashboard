# Tech Stack & Development

## Core Technologies

- **Frontend Framework**: React 19 with JSX
- **Build Tool**: Vite 6.x for fast development and building
- **Package Manager**: pnpm (required - see package.json packageManager field)
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (Radix UI primitives) - "new-york" style variant

## Key Dependencies

- **UI & Styling**: @radix-ui components, tailwindcss, framer-motion, lucide-react
- **Data Visualization**: recharts for interactive charts
- **Forms**: react-hook-form with @hookform/resolvers and zod validation
- **Routing**: react-router-dom
- **State Management**: React Context API (no external state library)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run linting
pnpm run lint

# Run tests
pnpm run test
```

## Code Style & Conventions

- **ESLint**: Configured with React hooks and refresh plugins
- **File Extensions**: Use `.jsx` for React components, `.js` for utilities
- **Import Aliases**: `@/` maps to `src/` directory
- **Component Naming**: PascalCase for components, camelCase for hooks and utilities
- **CSS Classes**: Use Tailwind utility classes with `cn()` helper for conditional styling

## Build Configuration

- **Vite Config**: Includes React plugin, Tailwind CSS plugin, and path aliases
- **Path Aliases**: `@/` resolves to `./src`
- **Target**: Modern browsers with ES2020+ support
