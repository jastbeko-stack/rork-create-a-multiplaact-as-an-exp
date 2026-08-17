import { Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDrDiet } from "@/store/DrDietStore";

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: "/", label: "الرئيسية" },
  { to: "/menu", label: "الوجبات" },
  { to: "/subscription", label: "اشتراكي" },
  { to: "/admin", label: "لوحة التحكم" },
];

/** Sticky RTL top navigation shared by every page. */
export function SiteHeader() {
  const [open, setOpen] = useState<boolean>(false);
  const { cartCount, cartTotal } = useDrDiet();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="دكتور دايت — الصفحة الرئيسية">
          <BrandMark compact />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative px-4 py-2 text-sm font-bold transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-primary transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2 lg:mr-0">
          <Link
            to="/checkout"
            className={cn(
              "relative hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:flex",
              cartCount === 0 && "opacity-70",
            )}
            aria-label={`السلة، ${cartCount} وجبة`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="tnum">{cartCount > 0 ? formatIQD(cartTotal) : "السلة فارغة"}</span>
            {cartCount > 0 && (
              <span className="tnum absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          <Button
            asChild
            className="h-10 rounded-md bg-primary px-5 text-sm font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
          >
            <Link to="/checkout">اشترك الآن</Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="القائمة"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden" aria-label="التنقل للجوال">
          <ul className="mx-auto max-w-[1400px] px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b border-border/60 py-3 text-sm font-bold transition-colors",
                    location.pathname === item.to ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
