'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tag, ArrowLeftRight, Settings, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../hooks/useTranslation';

const DRAWER_WIDTH = 240;

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navItems = [
    { label: t.home         || 'Dashboard',     icon: <Home          size={17} />, href: '/'             },
    { label: t.categories   || 'Categorías',    icon: <Tag           size={17} />, href: '/categories'   },
    { label: t.transactions || 'Transacciones', icon: <ArrowLeftRight size={17} />, href: '/transactions' },
    { label: t.settings     || 'Ajustes',       icon: <Settings      size={17} />, href: '/settings'     },
  ];

  return (
    <aside
      aria-label="Navegación principal"
      style={{
        position:      'fixed',
        top: 0, left: 0,
        width:         `${DRAWER_WIDTH}px`,
        height:        '100vh',
        display:       'flex',
        flexDirection: 'column',
        // Warm frosted glass — light, calm, inviting
        backgroundColor:      'rgba(255, 255, 255, 0.90)',
        backdropFilter:       'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderRight:   '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow:     '6px 0 24px rgba(0, 0, 0, 0.04)',
        zIndex:        100,
        overflowY:     'auto',
        overflowX:     'hidden',
      }}
    >
      {/* ── Brand ────────────────────────────────────────────────── */}
      <div
        style={{
          padding:      '22px 22px 18px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          flexShrink:   0,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl bg-indigo-500 text-white shrink-0"
            style={{ width: '36px', height: '36px' }}
            aria-hidden="true"
          >
            <Wallet size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-zinc-900 leading-tight tracking-tight truncate">
              {t.expense_tracker || 'Expense Tracker'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight font-normal">
              finanzas personales
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl',
                'text-[13.5px] font-medium leading-tight',
                'transition-all duration-[120ms]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                active
                  // Active: soft indigo tint, no harsh border
                  ? 'bg-indigo-500/[0.08] text-indigo-700'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/[0.04]',
              )}
            >
              {/* Icon */}
              <span
                className={cn(
                  'shrink-0 transition-colors duration-[120ms]',
                  active ? 'text-indigo-600' : 'text-zinc-400',
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div
        style={{
          padding:   '14px 22px 18px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}
      >
        <p className="text-[11px] text-zinc-400 font-normal">
          © 2025 · Expense Tracker
        </p>
      </div>
    </aside>
  );
}

export { DRAWER_WIDTH };
