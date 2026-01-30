import type { ButtonHTMLAttributes, Ref } from "react";

/**
 * Base button component - Minimal wrapper with no styling.
 * Use this as foundation for composition or custom button variants.
 *
 * @example
 * <ButtonBase onClick={handleClick}>Click me</ButtonBase>
 */

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

function ButtonBase({ children, ref, ...rest }: ButtonBaseProps) {
  return (
    <button {...rest} ref={ref}>
      {children}
    </button>
  );
}

export default ButtonBase;
