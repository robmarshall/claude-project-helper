/**
 * Card compound component with header, content, and footer slots
 *
 * REQUIRES:
 * - npm install clsx tailwind-merge
 * - classNames.ts utility from utils/classNames.ts
 *
 * @example
 * // Basic card
 * <Card>
 *   <CardContent>
 *     <p>Simple card content</p>
 *   </CardContent>
 * </Card>
 *
 * @example
 * // Full card with header and footer
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Account Settings</CardTitle>
 *     <CardDescription>Manage your account preferences</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <form>...</form>
 *   </CardContent>
 *   <CardFooter>
 *     <Button variant="secondary">Cancel</Button>
 *     <Button>Save Changes</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * // Hoverable card (for clickable items)
 * <Card className="hover:shadow-md hover:border-gray-300 transition-shadow cursor-pointer">
 *   <CardContent>
 *     <p>Click me</p>
 *   </CardContent>
 * </Card>
 */
import { forwardRef, type HTMLAttributes } from "react";
import { classNames } from "~/utils/classNames";

// =============================================================================
// CARD ROOT
// =============================================================================

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

// =============================================================================
// CARD HEADER
// =============================================================================

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// =============================================================================
// CARD TITLE
// =============================================================================

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={classNames("text-lg font-semibold leading-none text-gray-900", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={classNames("text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// =============================================================================
// CARD CONTENT
// =============================================================================

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={classNames("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// =============================================================================
// CARD FOOTER
// =============================================================================

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={classNames("flex items-center gap-2 p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
