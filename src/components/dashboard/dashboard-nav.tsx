"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/site/nav-icon";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

/** Sidebar on desktop, a horizontal scroller on phones. */
export function DashboardNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="lg:sticky lg:top-20">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => {
          const active =
            item.href === pathname ||
            (item.href !== "/dashboard" &&
              item.href !== "/admin/pipeline" &&
              pathname.startsWith(item.href));
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <NavIcon name={item.icon} />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge ? (
                  <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
