"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  List as MenuIcon,
  Bag,
  Heart,
  Chat,
  User,
  SignOut,
  Plus,
  Shield,
  Briefcase,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function UserAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClasses = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div
      className={cn(
        sizeClasses,
        "inline-flex items-center justify-center rounded-full font-bold",
        "bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-light))] text-white"
      )}
    >
      {initial}
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    function fetchUnread() {
      fetch("/api/messages/unread-count")
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.count ?? 0))
        .catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    window.addEventListener("daddy:messages-changed", fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("daddy:messages-changed", fetchUnread);
    };
  }, [session]);

  return (
    <nav className="sticky top-0 z-50 glass-strong" aria-label="ניווט ראשי">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <Image src="/logo.jpeg" alt="אבאל׳ה" width={40} height={40} className="rounded-full" unoptimized />
          <span className="text-gradient-hero text-xl font-extrabold tracking-tight hidden sm:inline">
            אבאל׳ה
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/" icon={<MagnifyingGlass className="h-4 w-4" />}>עיון</NavLink>
          <NavLink href="/gigs" icon={<Briefcase className="h-4 w-4" />}>שירותים</NavLink>

          {session?.user ? (
            <>
              {session.user.role === "SELLER" && (
                <NavLink href="/gigs/create" icon={<Plus className="h-4 w-4" />}>צור שירות</NavLink>
              )}
              <NavLink href="/orders" icon={<Bag className="h-4 w-4" />}>הזמנות</NavLink>
              <NavLink href="/favorites" icon={<Heart className="h-4 w-4" />}>מועדפים</NavLink>
              <NavLink href="/inbox" icon={<Chat className="h-4 w-4" />}>
                <span className="relative">
                  הודעות
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -end-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--color-error))] px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavLink>
              {session.user.role === "ADMIN" && (
                <NavLink href="/admin" icon={<Shield className="h-4 w-4" />}>ניהול</NavLink>
              )}

              <NotificationBell />
              <div className="mx-2 h-5 w-px bg-[rgb(var(--color-border))]" />

              <DropdownMenu
                open={profileOpen}
                onOpenChange={setProfileOpen}
                trigger={
                  <button className="flex items-center gap-2 rounded-full p-1 transition-all duration-200 hover:ring-2 hover:ring-[rgba(var(--color-primary),0.2)]">
                    <UserAvatar name={session.user.name || "U"} />
                  </button>
                }
              >
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold text-[rgb(var(--color-text))]">
                    {session.user.name}
                  </p>
                  <p className="text-xs mt-0.5 text-[rgb(var(--color-text-muted))]">
                    {session.user.email}
                  </p>
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={() => setProfileOpen(false)}>
                  <Link href="/profile" className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    הפרופיל שלי
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProfileOpen(false)}>
                  <Link href="/orders" className="flex items-center gap-2 w-full">
                    <Bag className="h-4 w-4" />
                    ההזמנות שלי
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setProfileOpen(false);
                    signOut();
                  }}
                >
                  <SignOut className="h-4 w-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3 me-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">התחברות</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">הצטרף לאבאל׳ה</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {session?.user && <NotificationBell />}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="פתח תפריט"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex flex-col gap-1">
          {session?.user && (
            <div className="flex items-center gap-3 rounded-xl bg-[rgb(var(--color-surface-elevated))] p-4 mb-4">
              <UserAvatar name={session.user.name || "U"} size="md" />
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--color-text))]">
                  {session.user.name}
                </p>
                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}

          <MobileNavLink href="/" onClick={() => setMobileOpen(false)} icon={<MagnifyingGlass className="h-4 w-4" />}>
            עיון
          </MobileNavLink>
          <MobileNavLink href="/gigs" onClick={() => setMobileOpen(false)} icon={<Briefcase className="h-4 w-4" />}>
            שירותים
          </MobileNavLink>

          {session?.user ? (
            <>
              {session.user.role === "SELLER" && (
                <MobileNavLink href="/gigs/create" onClick={() => setMobileOpen(false)} icon={<Plus className="h-4 w-4" />}>
                  צור שירות
                </MobileNavLink>
              )}
              <MobileNavLink href="/orders" onClick={() => setMobileOpen(false)} icon={<Bag className="h-4 w-4" />}>
                הזמנות
              </MobileNavLink>
              <MobileNavLink href="/favorites" onClick={() => setMobileOpen(false)} icon={<Heart className="h-4 w-4" />}>
                מועדפים
              </MobileNavLink>
              <MobileNavLink href="/inbox" onClick={() => setMobileOpen(false)} icon={<Chat className="h-4 w-4" />}>
                <span className="flex items-center gap-2">
                  הודעות
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--color-error))] px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </MobileNavLink>
              {session.user.role === "ADMIN" && (
                <MobileNavLink href="/admin" onClick={() => setMobileOpen(false)} icon={<Shield className="h-4 w-4" />}>
                  ניהול
                </MobileNavLink>
              )}
              <MobileNavLink href="/profile" onClick={() => setMobileOpen(false)} icon={<User className="h-4 w-4" />}>
                פרופיל
              </MobileNavLink>

              <div className="my-3 border-t border-[rgb(var(--color-border-light))]" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.05)] transition-colors"
              >
                <SignOut className="h-4 w-4" />
                התנתק
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="ghost" className="w-full justify-center" onClick={() => setMobileOpen(false)} asChild>
                <Link href="/login">התחברות</Link>
              </Button>
              <Button className="w-full justify-center" onClick={() => setMobileOpen(false)} asChild>
                <Link href="/register">הצטרף לאבאל׳ה</Link>
              </Button>
            </div>
          )}
        </div>
      </Sheet>
    </nav>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-secondary))] transition-colors duration-200 hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]"
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
  icon,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))] transition-colors duration-150 hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]"
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </Link>
  );
}
