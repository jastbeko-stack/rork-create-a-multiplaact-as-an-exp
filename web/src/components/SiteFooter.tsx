import { Instagram, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandMark } from "@/components/BrandMark";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

/** Shared footer with contact details for the Basra kitchen. */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-sunken">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <BrandMark />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            مطبخ دكتور دايت يطبخ وجباتك يومياً ويوزنها بالغرام حسب هدفك، ويوصلها لباب بيتك داخل البصرة.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">روابط</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/menu" className="text-foreground/80 transition-colors hover:text-primary">
                قائمة الوجبات
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="text-foreground/80 transition-colors hover:text-primary">
                حاسبة الماكروز والاشتراك
              </Link>
            </li>
            <li>
              <Link to="/subscription" className="text-foreground/80 transition-colors hover:text-primary">
                اشتراكي
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-foreground/80 transition-colors hover:text-primary">
                لوحة تحكم المطبخ
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">تواصل معنا</h3>
          <ul className="space-y-2 text-foreground/80">
            <li>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="tnum" dir="ltr">
                  +964 772 201 7005
                </span>
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              البصرة — حي الأساتذة، الأربع شوارع
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-primary" />
              <span dir="ltr">@dr.dite</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 دكتور دايت — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
