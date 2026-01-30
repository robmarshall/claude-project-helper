import { useLocation, useNavigate } from "react-router";

import Link from "~/atoms/Link";
import SkeletonLoader from "~/atoms/SkeletonLoader";
import { classNames } from "~/utils/classNames";

export interface Tab {
  name: string;
  href: string;
  current?: boolean;
  cleanHref?: string;
  count?: number;
}

/**
 * Format count with 99+ limit for badge display.
 */
const formatCount = (count: number): string => {
  if (count > 99) return "99+";
  return count.toString();
};

const cleanParams = (string: string): string => string?.split("?")[0];

/**
 * Loading skeleton for tabs.
 */
export const GhostTabs: React.FC<{ tabs: Tab[] }> = ({ tabs }) => (
  <>
    <div className="sm:hidden">
      <SkeletonLoader width="100%" height="40px" />
    </div>
    <div className="hidden sm:block">
      <div className="border-b border-gray-200">
        <nav
          className="-mb-px flex space-x-6 overflow-x-auto"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className="px-1 py-4 text-sm font-medium whitespace-nowrap"
            >
              <SkeletonLoader width="80px" height="20px" />
            </div>
          ))}
        </nav>
      </div>
    </div>
  </>
);

/**
 * Content wrapper for tab panels.
 */
export const TabBody: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="py-5">{children}</div>;

/**
 * Count badge component for tab notifications.
 */
const CountBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  return (
    <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-normal text-white">
      {formatCount(count)}
    </span>
  );
};

interface PureTabsProps {
  tabs: Tab[];
  isLoading?: boolean;
}

/**
 * Pure tabs component for manual current state control.
 * Use this when you need to control the current tab state manually.
 *
 * @example
 * const tabs = [
 *   { name: "Overview", href: "/overview", current: true },
 *   { name: "Settings", href: "/settings", current: false },
 * ];
 *
 * <PureTabs tabs={tabs} />
 */
export const PureTabs: React.FC<PureTabsProps> = ({ tabs, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <GhostTabs tabs={tabs} />;
  }

  return (
    <>
      {/* Mobile: Fixed bottom select dropdown */}
      <div className="align-center fixed right-0 bottom-0 left-0 z-50 mt-10 flex items-center gap-2 border-t border-gray-200 bg-white p-6 sm:relative sm:hidden sm:border-0 sm:p-0">
        <label
          htmlFor="tabs"
          className="text-sm leading-tight font-medium text-gray-500"
        >
          Menu
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-blue-500 focus:ring-blue-500 focus:outline-hidden sm:text-sm"
          defaultValue={tabs.find((tab) => tab.current)?.name}
          onChange={(e) => {
            const selectedTab = tabs.find((tab) => tab.name === e.target.value);
            if (selectedTab) {
              navigate(selectedTab.href);
            }
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>

      {/* Desktop: Horizontal tab bar */}
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={classNames(
                  tab.current
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 duration-200 ease-in-out hover:border-gray-300 hover:text-gray-700",
                  "border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap"
                )}
                aria-current={tab.current ? "page" : undefined}
              >
                {tab.name}
                <CountBadge count={tab.count || 0} />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

interface TabsProps {
  tabs: Tab[];
  isLoading?: boolean;
}

const normalizePath = (path: string): string =>
  path === "/" ? "/" : path.replace(/\/+$/, "");

/**
 * Tab navigation with automatic current tab detection based on URL.
 *
 * Features:
 * - Automatic current tab detection from pathname
 * - Responsive: select dropdown on mobile, tab bar on desktop
 * - Optional count badges with red notification styling
 * - Loading skeleton state
 *
 * @example
 * const tabs = [
 *   { name: "Units", href: `/properties/${id}` },
 *   { name: "Notes", href: `/properties/${id}/notes` },
 *   { name: "Files", href: `/properties/${id}/files` },
 *   { name: "Leases", href: `/properties/${id}/leases` },
 * ];
 *
 * <Tabs tabs={tabs} isLoading={isLoading} />
 *
 * @example
 * // With count badges
 * const tabs = [
 *   { name: "Inbox", href: "/inbox", count: 5 },
 *   { name: "Sent", href: "/sent" },
 *   { name: "Drafts", href: "/drafts", count: 2 },
 * ];
 *
 * <Tabs tabs={tabs} />
 */
const Tabs: React.FC<TabsProps> = ({ tabs, isLoading }) => {
  const pathname = useLocation().pathname;

  const cleanTabs = tabs.map((tab) => ({
    ...tab,
    cleanHref: cleanParams(tab.href),
  }));

  const normalizedPathname = normalizePath(pathname);

  // Find the most specific matching tab (longest matching path)
  const matchingTab = cleanTabs.reduce((acc, tab) => {
    const normalizedTabHref = normalizePath(tab.cleanHref!);
    const normalizedAccHref = normalizePath(acc.cleanHref!);

    if (
      normalizedPathname.startsWith(normalizedTabHref) &&
      normalizedTabHref.length > normalizedAccHref.length
    ) {
      return tab;
    }
    return acc;
  }, cleanTabs[0]);

  const tabsWithCurrent = cleanTabs.map((tab) => ({
    ...tab,
    current: tab.cleanHref === matchingTab.cleanHref,
  }));

  return <PureTabs tabs={tabsWithCurrent} isLoading={isLoading} />;
};

export default Tabs;
