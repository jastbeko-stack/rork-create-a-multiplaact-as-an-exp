import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useDrDiet } from "@/store/DrDietStore";

/** Blocks the admin console until the دكتور دايت team signs in. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdminAuthed } = useDrDiet();
  const location = useLocation();

  if (!isAdminAuthed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
