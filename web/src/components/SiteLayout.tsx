import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

interface SiteLayoutProps {
  children: React.ReactNode;
  withFooter?: boolean;
}

/** Page shell: shared header, scroll reset on navigation, optional footer. */
export function SiteLayout({ children, withFooter = true }: SiteLayoutProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {withFooter && <SiteFooter />}
    </div>
  );
}
