# Setup Quick Reference

## BEFORE USING TEMPLATES

1. Configure import path aliases (see below)
2. Install dependencies for the section you need

## Import Path Aliases

Templates use `~/` import paths (e.g., `~/utils/classNames`). Configure your project:

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts:**

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
  plugins: [tailwindcss(), react()],
});
```

## Dependencies by Section

### Forms + Styling

```bash
npm install react-hook-form @hookform/resolvers zod
npm install tailwindcss @tailwindcss/vite clsx tailwind-merge class-variance-authority
npm install -D @tailwindcss/postcss @tailwindcss/forms @tailwindcss/typography autoprefixer postcss
```

### Providers

No additional dependencies (React only).

### Components

```bash
npm install clsx tailwind-merge class-variance-authority
# Note: Tailwind CSS should already be installed from Forms + Styling section
```

### Data Fetching

```bash
npm install @tanstack/react-query qs
npm install -D @types/qs
```

## Tailwind Setup (v4)

If Tailwind isn't configured yet:

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D @tailwindcss/postcss @tailwindcss/forms @tailwindcss/typography autoprefixer postcss
```

**postcss.config.js:**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

**src/global.css:**

```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";

@theme {
  /* Custom theme configuration (replaces tailwind.config.js) */
  /* Example: --color-primary: #3b82f6; */
}

@layer base {
  /* Base element styles */
}

@layer utilities {
  /* Custom utility classes */
}
```

Import the CSS in your main entry file (e.g., `main.tsx`):

```tsx
import "./global.css";
```

Note: Tailwind v4 uses CSS-based configuration with `@theme {}` blocks instead of `tailwind.config.js`.
