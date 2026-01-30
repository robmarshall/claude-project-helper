import type { MouseEvent, ReactNode, Ref } from "react";
import { Link as RouterLink, useLocation } from "react-router";

interface LinkProps {
  children: ReactNode;
  href?: string;
  activeClass?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  ref?: Ref<HTMLAnchorElement>;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

/**
 * Link component for internal and external navigation.
 *
 * Uses react-router Link for internal routes (starting with `/` or `#`),
 * and standard `<a>` for external links.
 *
 * @example
 * // Internal link
 * <Link href="/dashboard">Dashboard</Link>
 *
 * @example
 * // External link (opens in new tab)
 * <Link href="https://example.com">External Site</Link>
 *
 * @example
 * // With active class styling
 * <Link href="/settings" activeClass="text-blue-600 font-bold">Settings</Link>
 *
 * @example
 * // Hash link
 * <Link href="#section">Jump to Section</Link>
 */
function Link({
  children,
  href = "",
  activeClass,
  className,
  onClick,
  ref,
  ...rest
}: LinkProps) {
  const pathname = useLocation().pathname;

  let classes = className;

  // Internal links start with exactly one slash or a hash
  const internal = /^[/#](?!\/)/.test(href);

  // Use RouterLink for internal links or when onClick is provided
  if (internal || onClick) {
    const cleanHref = href;

    if (!onClick) {
      if (pathname === cleanHref && activeClass) {
        classes += ` ${activeClass}`;
      }
    }

    return (
      <RouterLink
        to={cleanHref}
        onClick={onClick}
        className={classes}
        ref={ref}
        {...rest}
      >
        {children}
      </RouterLink>
    );
  }

  // External links open in new tab with security attributes
  return (
    <a
      href={href}
      className={classes}
      rel="noopener noreferrer"
      target="_blank"
      onClick={onClick}
      ref={ref}
      {...rest}
    >
      {children}
    </a>
  );
}

export default Link;
