import type { JSX } from "react";

import { classNames } from "~/utils/classNames";

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  background?: string;
  radius?: string;
  circle?: boolean;
  block?: boolean;
  style?: React.CSSProperties;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Animated skeleton placeholder for loading states.
 *
 * @example
 * // Basic usage
 * <SkeletonLoader width="200px" height="20px" />
 *
 * @example
 * // Circle avatar placeholder
 * <SkeletonLoader width="40px" height="40px" circle />
 *
 * @example
 * // Full width block
 * <SkeletonLoader width="100%" height="100px" />
 *
 * @example
 * // As a different element
 * <SkeletonLoader as="span" width="80px" height="1em" block={false} />
 */
function SkeletonLoader({
  width = "100%",
  height = "1em",
  background = "#E9ECEF",
  radius = "4px",
  circle = false,
  block = true,
  className = "",
  style = {},
  as: Tag = "div",
}: SkeletonLoaderProps) {
  return (
    <Tag
      className={classNames(
        "relative overflow-hidden bg-gray-200 animate-pulse",
        block ? "block" : "inline-block",
        "before:absolute before:inset-0 before:h-full before:w-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]",
        className
      )}
      style={{
        width,
        height,
        background,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
    >
      &zwnj;
    </Tag>
  );
}

export default SkeletonLoader;
