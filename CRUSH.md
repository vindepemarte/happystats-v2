# CRUSH Configuration

## Commands
build: npm run build
lint: npm run lint
test: npm test
single_test: npx vitest {path}

## Code Style
- Use absolute imports (src/...)
- TypeScript interfaces named PascalCase
- Tailwind classes in className
- camelCase for variables/functions
- Error middleware pattern (see lib/middleware/error-middleware.ts)
- Next.js app directory conventions
- Prefer optional chaining for null checks

## Git
- Add .crush/ to .gitignore

# Generated with Crush