"use client";

import { usePathname } from "next/navigation";
import { BookOpen, Container, LayoutGrid, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AppSidebarShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc = mounted && resolvedTheme === "light" ? "/logo-light.svg" : "/logo.svg";

  const navItem = (href: string, icon: React.ReactNode, label: string) => (
    <a
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
        pathname === href
          ? "bg-accent text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      {icon}
      {label}
    </a>
  );

  return (
    <aside
      className="w-52 shrink-0 flex flex-col border-r border-border"
      style={{ background: "var(--sidebar, var(--background))" }}
    >
      {/* Logo */}
      <div className="border-b border-border p-3 shrink-0">
        <a href="/">
          <img src={logoSrc} alt="Code Launcher" className="w-full h-auto" />
        </a>
      </div>

      <div className="flex-1 px-2 py-3 space-y-5 overflow-y-auto">

        {/* Nav — always visible on all pages */}
        <div className="space-y-0.5">
          {navItem("/", <LayoutGrid className="h-3.5 w-3.5" />, "Apps")}
          {navItem("/docker", <Container className="h-3.5 w-3.5" />, "Docker")}
          {navItem("/instructions", <BookOpen className="h-3.5 w-3.5" />, "API docs")}
        </div>

        {/* Page-specific content (filters on home page) */}
        {children}

      </div>
    </aside>
  );
}
