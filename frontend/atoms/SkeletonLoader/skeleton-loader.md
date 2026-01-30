## SkeletonLoader (`frontend/atoms/SkeletonLoader/index.tsx`)

Animated skeleton placeholder for loading states with shimmer effect.

**Features:**

- Customizable width, height, and border radius
- Circle mode for avatar placeholders
- Block or inline display
- Shimmer animation effect
- Render as any HTML element

**Tailwind Config:**

Add the shimmer animation to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
};
```

**Usage:**

```tsx
import SkeletonLoader from "~/atoms/SkeletonLoader";

// Text placeholder
<SkeletonLoader width="200px" height="20px" />

// Avatar placeholder
<SkeletonLoader width="40px" height="40px" circle />

// Full width card
<SkeletonLoader width="100%" height="120px" radius="8px" />

// Inline text
<SkeletonLoader as="span" width="80px" height="1em" block={false} />
```
