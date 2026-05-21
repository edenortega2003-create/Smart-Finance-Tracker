'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : authError.message,
      );
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(145deg, #FFF9E6 0%, #FFFDF7 55%, #F0FDFA 100%)',
      padding:        '24px 16px',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     '400px',
        background:   '#ffffff',
        borderRadius: '24px',
        padding:      '40px 32px',
        boxShadow:    '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        border:       '1px solid rgba(0,0,0,0.06)',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '44px',
            height:         '44px',
            borderRadius:   '14px',
            background:     'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow:      '0 4px 14px rgba(16,185,129,0.32)',
            flexShrink:     0,
          }}>
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 17V5L11 12L19 5V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="11" y1="17" x2="11" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="20" x2="15" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="20" r="1" fill="white" />
              <circle cx="15" cy="20" r="1" fill="white" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827', letterSpacing: '-0.025em' }}>
              MentHabit
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
              hábitos financieros
            </p>
          </div>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.03em' }}>
          Bienvenido
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#6B7280' }}>
          Inicia sesión para acceder a tus hábitos financieros.
        </p>

        {/* Error */}
        {error && (
          <div role="alert" style={{
            padding:      '10px 14px',
            borderRadius: '10px',
            background:   '#FFF1F2',
            border:       '1px solid rgba(239,68,68,0.20)',
            color:        '#BE123C',
            fontSize:     '13px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{
                width:        '100%',
                height:       '44px',
                padding:      '0 14px',
                borderRadius: '10px',
                border:       '1.5px solid #E5E7EB',
                fontSize:     '14px',
                color:        '#111827',
                background:   '#ffffff',
                outline:      'none',
                boxSizing:    'border-box',
                fontFamily:   'inherit',
                transition:   'border-color 150ms ease',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = '#6366F1')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width:        '100%',
                height:       '44px',
                padding:      '0 14px',
                borderRadius: '10px',
                border:       '1.5px solid #E5E7EB',
                fontSize:     '14px',
                color:        '#111827',
                background:   '#ffffff',
                outline:      'none',
                boxSizing:    'border-box',
                fontFamily:   'inherit',
                transition:   'border-color 150ms ease',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = '#6366F1')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width:          '100%',
              height:         '46px',
              borderRadius:   '12px',
              border:         'none',
              background:     loading ? '#A5B4FC' : '#6366F1',
              color:          '#ffffff',
              fontSize:       '15px',
              fontWeight:     700,
              cursor:         loading ? 'not-allowed' : 'pointer',
              transition:     'background 150ms ease',
              marginTop:      '4px',
              letterSpacing:  '-0.01em',
            }}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>
          ¿Sin cuenta?{' '}
          <Link href="/signup" style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
