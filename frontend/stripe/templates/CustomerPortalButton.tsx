// components/Stripe/CustomerPortalButton.tsx
import { useMutation } from "@tanstack/react-query";
import { rest } from "~/lib/api/rest"; // Adjust to your API client
import { Button } from "~/atoms/buttons/Button";

interface PortalSessionResponse {
  url: string;
}

interface CreatePortalParams {
  organizationId: string;
  returnUrl?: string;
}

/**
 * Hook to create and open Stripe Customer Portal
 */
export const useCustomerPortal = () => {
  return useMutation({
    mutationFn: async ({ organizationId, returnUrl }: CreatePortalParams) => {
      const response = await rest.post<PortalSessionResponse>(
        "/api/stripe/customer-portal-session",
        {
          organization: organizationId,
          returnUrl: returnUrl || window.location.href,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      // Open portal in new window
      window.open(data.url, "_blank");
    },
  });
};

interface CustomerPortalButtonProps {
  /** Organization ID for the portal session */
  organizationId: string;
  /** URL to return to after portal (defaults to current page) */
  returnUrl?: string;
  /** Custom button text */
  children?: React.ReactNode;
  /** Additional button props */
  className?: string;
}

/**
 * Button to open Stripe Customer Portal in a new window
 *
 * The Customer Portal allows users to:
 * - Update payment methods
 * - View billing history
 * - Cancel subscriptions
 * - Update billing information
 *
 * @example
 * <CustomerPortalButton
 *   organizationId="org_123"
 *   returnUrl="/settings/billing"
 * >
 *   Manage Billing
 * </CustomerPortalButton>
 */
export const CustomerPortalButton = ({
  organizationId,
  returnUrl,
  children = "Manage Subscription",
  className,
}: CustomerPortalButtonProps) => {
  const { mutate, isPending, isError } = useCustomerPortal();

  return (
    <Button
      variant="secondary"
      onClick={() => mutate({ organizationId, returnUrl })}
      isLoading={isPending}
      disabled={isPending}
      className={className}
    >
      {children}
    </Button>
  );
};

export default CustomerPortalButton;
