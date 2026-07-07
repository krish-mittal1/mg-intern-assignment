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
    <header className="border-b border-line bg-surface/80">
      <div className="mx-auto flex max-w-3xl items-baseline justify-between px-5 py-4 sm:px-7">
        <Link href="/" className="font-serif text-[1.35rem] tracking-tight text-ink">
          signkit
        </Link>
        <nav className="flex gap-6 text-[0.9rem]">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "border-b-2 border-accent pb-0.5 text-ink"
                    : "text-muted hover:text-ink"
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
