import { Link } from "react-router-dom";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
    <BrandMark />
    <p className="brand-latin text-7xl text-foreground/15">404</p>
    <h1 className="text-2xl font-black text-foreground">الصفحة غير موجودة</h1>
    <p className="max-w-md text-sm text-muted-foreground">
      الرابط الذي فتحته غير متوفر. رجاءً ارجع للرئيسية أو تصفح قائمة وجبات دكتور دايت.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <Button asChild className="h-11 rounded-md bg-primary px-6 font-extrabold text-primary-foreground hover:bg-primary/90">
        <Link to="/">الصفحة الرئيسية</Link>
      </Button>
      <Button asChild variant="outline" className="h-11 rounded-md border-border px-6 font-extrabold">
        <Link to="/menu">قائمة الوجبات</Link>
      </Button>
    </div>
  </div>
);

export default NotFound;
