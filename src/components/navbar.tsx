"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="avatar h-9 w-9 text-sm bg-gradient-featured text-white"
      title={name}
    >
      {initial}
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobile = () => setMenuOpen(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-gradient-hero text-2xl font-extrabold tracking-tight">
            אבאל׳ה
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/">עיון</NavLink>

          {session?.user ? (
            <>
              {session.user.role === "SELLER" && (
                <NavLink href="/gigs/create">צור שירות</NavLink>
              )}
              <NavLink href="/orders">הזמנות</NavLink>
              <NavLink href="/favorites">מועדפים</NavLink>
              <NavLink href="/inbox">
                <span className="flex items-center gap-1.5">
                  הודעות
                </span>
              </NavLink>
              {session.user.role === "ADMIN" && (
                <NavLink href="/admin">ניהול</NavLink>
              )}

              {/* Profile dropdown */}
              <div className="relative me-2" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full p-1 transition-all duration-200 hover:ring-2"
                  style={{
                    ["--tw-ring-color" as string]: "var(--color-primary-pale)",
                  }}
                >
                  <UserAvatar name={session.user.name || "U"} />
                </button>

                {profileOpen && (
                  <div
                    className="absolute start-0 top-full mt-2 w-56 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <div
                      className="px-4 py-3 mb-1"
                      style={{
                        borderBottom: "1px solid var(--color-border-light)",
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {session.user.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {session.user.email}
                      </p>
                    </div>

                    <DropdownLink href="/profile" onClick={() => setProfileOpen(false)}>
                      הפרופיל שלי
                    </DropdownLink>
                    <DropdownLink href="/orders" onClick={() => setProfileOpen(false)}>
                      ההזמנות שלי
                    </DropdownLink>
                    <div
                      className="my-1"
                      style={{ borderTop: "1px solid var(--color-border-light)" }}
                    />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150"
                      style={{ color: "var(--color-accent-warm)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FFF5F5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      התנתק
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 me-3">
              <Link
                href="/login"
                className="btn-ghost text-sm"
              >
                התחברות
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm"
              >
                הצטרף לאבאל׳ה
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex items-center justify-center h-10 w-10 md:hidden transition-colors duration-200"
          style={{
            borderRadius: "var(--radius-button)",
            color: "var(--color-text-secondary)",
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-primary-pale)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          borderTop: menuOpen ? "1px solid var(--color-border-light)" : "none",
        }}
      >
        <div className="px-5 py-4 flex flex-col gap-1">
          <MobileNavLink href="/" onClick={closeMobile}>
            עיון
          </MobileNavLink>

          {session?.user ? (
            <>
              <div
                className="flex items-center gap-3 px-3 py-3 mb-2"
                style={{
                  backgroundColor: "var(--color-primary-pale)",
                  borderRadius: "var(--radius-button)",
                }}
              >
                <UserAvatar name={session.user.name || "U"} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {session.user.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {session.user.email}
                  </p>
                </div>
              </div>

              {session.user.role === "SELLER" && (
                <MobileNavLink href="/gigs/create" onClick={closeMobile}>
                  צור שירות
                </MobileNavLink>
              )}
              <MobileNavLink href="/orders" onClick={closeMobile}>
                הזמנות
              </MobileNavLink>
              <MobileNavLink href="/favorites" onClick={closeMobile}>
                מועדפים
              </MobileNavLink>
              <MobileNavLink href="/inbox" onClick={closeMobile}>
                הודעות
              </MobileNavLink>
              {session.user.role === "ADMIN" && (
                <MobileNavLink href="/admin" onClick={closeMobile}>
                  ניהול
                </MobileNavLink>
              )}
              <MobileNavLink href="/profile" onClick={closeMobile}>
                פרופיל
              </MobileNavLink>

              <div
                className="my-2"
                style={{ borderTop: "1px solid var(--color-border-light)" }}
              />
              <button
                onClick={() => {
                  closeMobile();
                  signOut();
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150"
                style={{
                  color: "var(--color-accent-warm)",
                  borderRadius: "var(--radius-button)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FFF5F5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                התנתק
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link
                href="/login"
                onClick={closeMobile}
                className="btn-ghost text-sm w-full justify-center"
              >
                התחברות
              </Link>
              <Link
                href="/register"
                onClick={closeMobile}
                className="btn-primary text-sm w-full justify-center"
              >
                הצטרף לאבאל׳ה
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ---- Sub-components ---- */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative px-3 py-2 text-sm font-medium transition-colors duration-200"
      style={{ color: "var(--color-text-secondary)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-primary)";
        e.currentTarget.style.backgroundColor = "var(--color-primary-pale)";
        e.currentTarget.style.borderRadius = "var(--radius-button)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150"
      style={{
        color: "var(--color-text-secondary)",
        borderRadius: "var(--radius-button)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-primary)";
        e.currentTarget.style.backgroundColor = "var(--color-primary-pale)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150"
      style={{ color: "var(--color-text-secondary)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-primary-pale)";
        e.currentTarget.style.color = "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
    >
      {children}
    </Link>
  );
}
