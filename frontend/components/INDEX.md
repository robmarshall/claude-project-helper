# Components Quick Reference

## BEFORE YOU START

Check user's project:
1. What component structure exists? → Follow their patterns (don't enforce atomic design)
2. Do they have a `components/` folder? → Check how it's organized
3. Do they use a UI library (shadcn, Chakra, MUI)? → Integrate with it, don't replace
4. Is classNames.ts or similar utility present? → Use their class merging approach

### If existing project:
- Match their folder structure and naming conventions
- Add new components at the same level as similar existing ones
- Don't reorganize into atomic design unless explicitly requested

### If greenfield project:
- Use the atomic design patterns below
- Start simple: atoms/ and molecules/ are usually enough initially

## DECISION TREE

```
Single element, no logic?              → ATOM (Button, Input, Icon)
Group of atoms, minimal logic?         → MOLECULE (FormField, Card, SearchBar)
Has business logic or fetches data?    → ORGANISM (Header, LoginForm, DataTable)
Defines page layout?                   → TEMPLATE (DashboardTemplate)
Route with real data?                  → PAGE (DashboardPage)
```

## FOLDER STRUCTURE

```
src/
  atoms/       # Button, Input, Icon
  molecules/   # FormField, Card
  organisms/   # Header, LoginForm
  templates/   # DashboardTemplate
  pages/       # DashboardPage
```

## RULES BY LEVEL

| Level | Can use | Cannot use |
|-------|---------|------------|
| Atom | props only | context, business logic |
| Molecule | atoms, UI state | context, API calls |
| Organism | atoms, molecules, context | - |
| Template | all, defines slots | real data |
| Page | all + route data | heavy logic |

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Level | Purpose | Requires |
|------|-------|---------|----------|
| Button.tsx | Atom | Button with variants, loading state | classNames.ts, cva |
| Card.tsx | Molecule | Content card with header/body/footer | classNames.ts |
| Modal.tsx | Molecule | Dialog with portal, focus trap, a11y | classNames.ts |

### Copy Order
1. Copy `classNames.ts` from utils/ first
2. Copy component templates as needed
3. Place in appropriate atomic level folder

## DEEP DIVE

- Full examples → atomic-design.md
