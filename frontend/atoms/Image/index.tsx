import { useEffect, useRef, useState } from "react";

import type { ImageProps as UnpicImageProps } from "@unpic/react";
import { Image as UnpicImage } from "@unpic/react";

import { classNames } from "~/utils/classNames";

/**
 * Optimized image component using Unpic for automatic CDN optimization.
 *
 * Features:
 * - Automatic image optimization via Unpic
 * - Fade-in animation on load
 * - Cached image detection for instant display
 * - Responsive sizing support
 *
 * @info https://unpic.pics/img/react/#cdn
 *
 * @example
 * // Basic usage
 * <Image src="/hero.jpg" alt="Hero image" />
 *
 * @example
 * // With sizing
 * <Image src="/product.jpg" alt="Product" width={400} height={300} />
 *
 * @example
 * // With custom styles
 * <Image src="/avatar.jpg" alt="User" className="rounded-full" />
 */
const Image: React.FC<UnpicImageProps> = (props) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setIsCached(true);
      setIsLoaded(true);
    }
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const finalClassName = classNames(
    !isCached && "duration-300 transition-opacity",
    !isCached && !isLoaded && "opacity-0",
    !isCached && isLoaded && "opacity-100",
    props.className
  );

  return (
    <UnpicImage
      {...props}
      ref={imageRef}
      onLoad={handleImageLoad}
      className={finalClassName}
    />
  );
};

export interface BasicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  loading?: "lazy" | "eager";
}

/**
 * Basic image component with fade-in animation.
 *
 * Use this for simple images that don't need CDN optimization,
 * or when you need more control over the img element.
 *
 * @example
 * // Lazy loaded (default)
 * <BasicImage src="/icon.png" alt="Icon" />
 *
 * @example
 * // Eager loading for above-the-fold images
 * <BasicImage src="/logo.svg" alt="Logo" loading="eager" />
 */
export const BasicImage: React.FC<BasicImageProps> = ({
  loading = "lazy",
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  return (
    <img
      {...props}
      onLoad={() => setTimeout(() => setIsLoaded(true), 10)}
      className={classNames(
        "opacity-0 transition-opacity duration-300",
        isLoaded && "opacity-100",
        className
      )}
      loading={loading}
    />
  );
};

export default Image;
