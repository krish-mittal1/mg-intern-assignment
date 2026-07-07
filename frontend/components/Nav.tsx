"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/status", label: "Status" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-[1.4rem] font-bold tracking-tight text-ink"
        >
          SignFlow
        </Link>

        <nav className="flex items-center gap-8 text-[0.95rem]">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "border-b border-accent pb-0.5 text-accent"
                    : "text-muted transition-colors hover:text-accent"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
