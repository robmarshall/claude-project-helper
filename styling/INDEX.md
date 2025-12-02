# Styling Quick Reference

## BEFORE YOU START

Check: Is Tailwind configured? If not, set it up first.

## COPY-PASTE PATTERNS

**Button:**
```
inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
```

**Input:**
```
block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600
```

**Card:**
```
bg-white rounded-lg shadow-sm border border-gray-200 p-6
```

**Container:**
```
mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
```

## CORE RULES

1. Mobile-first (base → md: → lg:)
2. Use Tailwind scale, avoid arbitrary [values]
3. Class order: Layout → Sizing → Spacing → Typography → Visual → States
4. clsx for conditionals, cva for variants

## STATES

| State | Classes |
|-------|---------|
| Hover | hover:bg-gray-50 |
| Focus | focus:ring-2 focus:ring-blue-500 |
| Disabled | disabled:opacity-50 disabled:cursor-not-allowed |
| Error | ring-red-300 text-red-900 |

## TEMPLATES

All templates are in the `templates/` subdirectory. Note: `classNames.ts` is in the root `utils/` folder, not in templates.

| File | Purpose | When to use |
|------|---------|-------------|
| classNames.ts | Class merging utility (clsx + tailwind-merge) | Always - foundation for all components |
| buttonVariants.ts | CVA button configuration | Building variant-based Button component |

### Copy Order
1. `classNames.ts` → Required by components using conditional classes
2. `buttonVariants.ts` → Use with Button component

Note: Tailwind v4 uses CSS-based configuration with `@theme {}` blocks instead of config files. See `setup/INDEX.md` for setup instructions.

## DEEP DIVE

- Variant systems → tailwind-patterns.md
- cva examples → tailwind-patterns.md
