## Image (`frontend/atoms/Image/index.tsx`)

Image component wrapper using Unpic library for automatic CDN optimization.

**Features:**

- Automatic image optimization via Unpic (supports major CDNs)
- Fade-in animation on load with opacity transitions
- Caching detection for immediate display (no flash)
- Two variants: `Image` (Unpic-powered) and `BasicImage` (standard img)
- Lazy loading support
- Responsive sizing

**Dependencies:**

```bash
npm install @unpic/react
```

**Usage:**

```tsx
import Image, { BasicImage } from "~/atoms/Image";

// Optimized image with Unpic
<Image src="/property-image.jpg" alt="Property" className="rounded-lg" />

// With explicit dimensions
<Image src="/hero.jpg" alt="Hero" width={800} height={400} />

// Basic image without CDN optimization
<BasicImage src="/avatar.jpg" alt="Avatar" />

// Eager loading for above-the-fold content
<BasicImage src="/logo.svg" alt="Logo" loading="eager" />
```

**When to use which:**

- `Image` - Most images. Provides automatic CDN optimization and responsive sizing.
- `BasicImage` - Simple images, icons, or when you need direct img element control.
