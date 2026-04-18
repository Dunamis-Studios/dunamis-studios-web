"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { initials } from "@/lib/utils";
import { Container } from "@/components/ui/primitives";

interface Props {
  firstName: string;
  lastName: string;
  email: string;
  children: React.ReactNode;
}

export function AccountShell({ firstName, lastName, email, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-1">
              <TabLink href="/account" active={pathname === "/account"}>
                Dashboard
              </TabLink>
              <TabLink
                href="/account/settings"
                active={pathname?.startsWith("/account/settings") ?? false}
              >
                Settings
              </TabLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm hover:border-[var(--border-strong)] transition-colors"
                  aria-label="Account menu"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-[var(--fg)]">
                    {firstName}
                  </span>
                  <ChevronDown
                    className="h-3.5 w-3.5 text-[var(--fg-subtle)]"
                    aria-hidden
                  />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" className="min-w-[14rem]">
                <DropdownLabel className="truncate">{email}</DropdownLabel>
                <DropdownSeparator />
                <DropdownItem asChild>
                  <Link href="/account">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownItem>
                <DropdownItem asChild>
                  <Link href="/account/settings">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem onSelect={logout}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
        <div className="md:hidden border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 py-2 sm:px-6 lg:px-8">
            <TabLink href="/account" active={pathname === "/account"}>
              Dashboard
            </TabLink>
            <TabLink
              href="/account/settings"
              active={pathname?.startsWith("/account/settings") ?? false}
            >
              Settings
            </TabLink>
          </div>
        </div>
      </header>
      <Container size="lg" className="py-10 sm:py-14">
        {children}
      </Container>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-1.5 text-sm transition-colors " +
        (active
          ? "text-[var(--fg)] bg-[var(--bg-muted)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)]")
      }
    >
      {children}
    </Link>
  );
}
