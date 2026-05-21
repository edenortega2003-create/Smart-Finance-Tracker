'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home, Tag, ArrowLeftRight, Settings, PlusCircle, TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const DRAWER_WIDTH = 248;

/* ─── Primary CTA link (Registro) ──────────────────────────────────── */
function PrimaryLink({
  href, icon, label, active,
}: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '13px 16px',
        borderRadius:   '16px',
        textDecoration: 'none',
        fontWeight:     700,
        fontSize:       '14px',
        letterSpacing:  '-0.015em',
        transition:     'all 180ms cubic-bezier(0.4,0,0.2,1)',
        background: active
          ? 'linear-gradient(135deg, #10B981 0%, #0EA5A0 100%)'
          : hovered
          ? 'rgba(16,185,129,0.11)'
          : 'rgba(16,185,129,0.06)',
        color:     active ? '#ffffff' : '#059669',
        boxShadow: active
          ? '0 8px 28px rgba(16,185,129,0.28), 0 2px 8px rgba(16,185,129,0.16)'
          : hovered
          ? '0 3px 10px rgba(16,185,129,0.12)'
          : 'none',
        border:    active
          ? '1.5px solid transparent'
          : `1.5px solid rgba(16,185,129,${hovered ? '0.28' : '0.16'})`,
        transform: hovered && !active ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* Icon container */}
      <span style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '32px',
        height:         '32px',
        borderRadius:   '10px',
        background:     active ? 'rgba(255,255,255,0.24)' : 'rgba(16,185,129,0.14)',
        color:          active ? '#ffffff' : '#10B981',
        flexShrink:     0,
        transition:     'background 180ms ease',
      }}>
        {icon}
      </span>

      {/* Label */}
      <span style={{ flex: 1 }}>{label}</span>

      {/* Arrow indicator */}
      <span style={{
        fontSize:    '16px',
        lineHeight:  1,
        opacity:     active ? 0.75 : hovered ? 0.60 : 0.25,
        color:       active ? '#ffffff' : '#10B981',
        transition:  'opacity 180ms ease, transform 180ms ease',
        transform:   hovered ? 'translateX(2px)' : 'translateX(0)',
      }}>›</span>
    </Link>
  );
}

/* ─── Standard nav link ─────────────────────────────────────────────── */
function NavLink({
  href, icon, label, active,
}: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        paddingTop:     '9px',
        paddingBottom:  '9px',
        // 3px extra left padding reserves space for the inset active indicator
        paddingLeft:    '15px',
        paddingRight:   '12px',
        borderRadius:   '12px',
        textDecoration: 'none',
        fontWeight:     active ? 600 : 400,
        fontSize:       '13.5px',
        letterSpacing:  '-0.01em',
        color:          active ? '#3730A3' : hovered ? '#374151' : '#6B7280',
        background:     active
          ? 'rgba(99,102,241,0.07)'
          : hovered
          ? 'rgba(0,0,0,0.03)'
          : 'transparent',
        // inset left shadow = active indicator (no layout shift, no extra DOM node)
        boxShadow:  active ? 'inset 3px 0 0 #6366F1' : 'none',
        transition: 'all 130ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Icon container */}
      <span style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '28px',
        height:         '28px',
        borderRadius:   '8px',
        flexShrink:     0,
        background:     active
          ? 'rgba(99,102,241,0.11)'
          : hovered
          ? 'rgba(0,0,0,0.05)'
          : 'transparent',
        color:      active ? '#6366F1' : hovered ? '#374151' : '#9CA3AF',
        transition: 'all 130ms ease',
      }}>
        {icon}
      </span>

      {label}
    </Link>
  );
}

/* ─── Settings link (muted, bottom) ────────────────────────────────── */
function SettingsLink({
  href, icon, label, active,
}: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '9px 12px',
        borderRadius:   '12px',
        textDecoration: 'none',
        fontWeight:     active ? 600 : 400,
        fontSize:       '13px',
        color:          active ? '#374151' : hovered ? '#4B5563' : '#9CA3AF',
        background:     active
          ? 'rgba(0,0,0,0.04)'
          : hovered
          ? 'rgba(0,0,0,0.025)'
          : 'transparent',
        transition: 'all 130ms ease',
      }}
    >
      <span style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '26px',
        height:         '26px',
        borderRadius:   '8px',
        flexShrink:     0,
        color:          active ? '#4B5563' : hovered ? '#6B7280' : '#C0C5CE',
        transition:     'color 130ms ease',
      }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

/* ─── Section label ─────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize:      '10px',
      fontWeight:    700,
      color:         '#C4C9D4',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      padding:       '0 15px',
      margin:        '12px 0 4px',
      userSelect:    'none',
    }}>
      {children}
    </p>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{
      height:     '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent 100%)',
      margin:     '4px 0',
      flexShrink: 0,
    }} />
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { t }  = useTranslation();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const mainNav = [
    { label: t.home         || 'Dashboard',     icon: <Home          size={16} />, href: '/'            },
    { label: t.transactions || 'Transacciones', icon: <ArrowLeftRight size={16} />, href: '/transactions' },
    { label: t.categories   || 'Categorías',    icon: <Tag           size={16} />, href: '/categories'  },
  ];

  return (
    <aside
      aria-label="Navegación principal"
      style={{
        position:             'fixed',
        top:                  0,
        left:                 0,
        width:                `${DRAWER_WIDTH}px`,
        height:               '100vh',
        display:              'flex',
        flexDirection:        'column',
        backgroundColor:      'rgba(255, 255, 255, 0.94)',
        backdropFilter:       'blur(32px) saturate(160%)',
        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
        borderRight:          '1px solid rgba(0, 0, 0, 0.055)',
        boxShadow:            '6px 0 32px rgba(0, 0, 0, 0.032)',
        zIndex:               100,
        overflowY:            'auto',
        overflowX:            'hidden',
      }}
    >

      {/* ── Brand header ────────────────────────────────────────────── */}
      <div style={{
        padding:      '20px 16px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.055)',
        flexShrink:   0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* MentHabit M-balanza logo */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '40px',
            height:         '40px',
            borderRadius:   '13px',
            background:     'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow:      '0 4px 14px rgba(16,185,129,0.32)',
            flexShrink:     0,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* M letterform */}
              <path d="M3 17V5L11 12L19 5V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* Balance scale arms */}
              <line x1="11" y1="17" x2="11" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="20" x2="15" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              {/* Scale pans */}
              <circle cx="7" cy="20" r="1" fill="white" />
              <circle cx="15" cy="20" r="1" fill="white" />
            </svg>
          </div>

          {/* App name */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize:      '15px',
              fontWeight:    700,
              color:         '#111827',
              lineHeight:    1.2,
              letterSpacing: '-0.025em',
              margin:        0,
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap',
            }}>
              MentHabit
            </p>
            <p style={{
              fontSize:   '11px',
              color:      '#10B981',
              lineHeight:  1.3,
              margin:     '2px 0 0',
              fontWeight:  500,
              letterSpacing: '0.01em',
            }}>
              hábitos financieros
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick-entry CTAs ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 12px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <PrimaryLink
          href="/registro"
          icon={<PlusCircle size={18} />}
          label="Registrar gasto"
          active={isActive('/registro')}
        />
        <PrimaryLink
          href="/ingresos"
          icon={<TrendingUp size={18} />}
          label="Registrar ingreso"
          active={isActive('/ingresos')}
        />
      </div>

      <Divider />

      {/* ── Main navigation ──────────────────────────────────────────── */}
      <nav
        aria-label="Páginas principales"
        style={{
          flex:          1,
          padding:       '2px 12px',
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        <SectionLabel>Explorar</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {mainNav.map(item => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
        </div>
      </nav>

      {/* ── Settings (bottom, separated) ─────────────────────────────── */}
      <div style={{ padding: '4px 12px 12px', flexShrink: 0 }}>
        <Divider />
        <SectionLabel>Configurar</SectionLabel>
        <SettingsLink
          href="/settings"
          icon={<Settings size={15} />}
          label={t.settings || 'Ajustes'}
          active={isActive('/settings')}
        />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{
        padding:    '10px 18px 16px',
        borderTop:  '1px solid rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}>
        <p style={{
          fontSize:  '10.5px',
          color:     '#C4C9D4',
          margin:    0,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}>
          © 2025 · MentHabit
        </p>
      </div>
    </aside>
  );
}
