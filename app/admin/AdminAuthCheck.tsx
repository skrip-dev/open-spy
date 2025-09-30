"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check on login page (main admin page)
    if (pathname === "/admin") {
      return;
    }

    // Check if token exists for other admin routes
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.push("/admin");
    }
  }, [router, pathname]);

  return <>{children}</>;
}
