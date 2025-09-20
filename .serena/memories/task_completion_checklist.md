# Task Completion Checklist

## Before Completing Any Task
1. **Lint and Type Check**
   - Frontend: `cd packages/web && pnpm lint && pnpm typecheck`
   - Backend: `cd packages/tasks && make lint`

2. **Test Changes**
   - Run development server: `cd packages/web && pnpm dev`
   - Test functionality in browser
   - Verify database changes if applicable

3. **Code Quality**
   - Follow functional programming style
   - Keep files under 200 lines
   - Keep functions under 40 lines
   - Use proper import order (external → internal, far → near)
   - Prefer named exports over default exports
   - Use `type` over `interface`

4. **Commit Guidelines**
   - Commit after completing and testing each small feature
   - Use `--no-verify` if pre-commit hooks fail (deps-check.nu issues)
   - Refactor before starting next feature

## Database Changes
- Apply migrations: `yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/`
- Verify schema changes work correctly
- Test related API endpoints

## Environment Setup
- Ensure `.env.local` has required variables for development
- Test authentication if admin features are involved