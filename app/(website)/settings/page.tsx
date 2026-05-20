'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AppSettings, Currency, Language } from '../../types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTranslation } from '../../hooks/useTranslation';
import { User, Settings2, Database, AlertTriangle, Download, Upload, Save, X } from 'lucide-react';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateImportData(data: unknown): { ok: boolean; error?: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'El archivo no es compatible con MentHabit.' };
  }
  const d = data as Record<string, unknown>;
  if ('transactions' in d && !Array.isArray(d.transactions)) {
    return { ok: false, error: '"transactions" debe ser un arreglo.' };
  }
  if ('settings' in d && (typeof d.settings !== 'object' || d.settings === null || Array.isArray(d.settings))) {
    return { ok: false, error: '"settings" no tiene el formato correcto.' };
  }
  return { ok: true };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsCard({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: danger ? '1.5px solid rgba(239,68,68,0.22)' : '1px solid rgba(0,0,0,0.06)',
      boxShadow: danger ? '0 2px 12px rgba(239,68,68,0.05)' : '0 2px 8px rgba(0,0,0,0.05)',
      padding: '20px',
      marginBottom: '16px',
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, danger }: { icon: React.ReactNode; title: string; danger?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '16px', paddingBottom: '12px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
        backgroundColor: danger ? 'rgba(239,68,68,0.09)' : 'rgba(16,185,129,0.09)',
        color: danger ? '#EF4444' : '#10B981',
      }}>
        {icon}
      </span>
      <h2 style={{
        fontSize: '14px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em',
        color: danger ? '#DC2626' : '#111827',
      }}>
        {title}
      </h2>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block', fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
        marginBottom: '6px', letterSpacing: '0.07em', textTransform: 'uppercase',
      }}
    >
      {children}
    </label>
  );
}

// ─── Shared input styles (inline — CSS bypass pattern) ────────────────────────

const fieldInput: React.CSSProperties = {
  width: '100%', height: '44px', borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.12)', padding: '0 12px',
  fontSize: '14px', color: '#111827', backgroundColor: '#FAFAFA',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease',
};

const btnGreen: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  height: '40px', padding: '0 18px', borderRadius: '10px',
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  color: '#fff', border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
  boxShadow: '0 3px 10px rgba(16,185,129,0.28)',
  transition: 'opacity 150ms ease',
};

const btnGhost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  height: '40px', padding: '0 16px', borderRadius: '10px',
  background: 'rgba(16,185,129,0.08)', color: '#059669',
  border: '1px solid rgba(16,185,129,0.20)', cursor: 'pointer',
  fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
};

const btnIndigo: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  height: '40px', padding: '0 16px', borderRadius: '10px',
  background: 'rgba(99,102,241,0.08)', color: '#4F46E5',
  border: '1px solid rgba(99,102,241,0.20)', cursor: 'pointer',
  fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
};

const btnDangerOutline: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  height: '40px', padding: '0 16px', borderRadius: '10px',
  background: 'rgba(239,68,68,0.07)', color: '#DC2626',
  border: '1px solid rgba(239,68,68,0.22)', cursor: 'pointer',
  fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const {
    settings, updateSettings, transactions, categories,
    importData, clearAllData, setLoading, hideLoading,
  } = useStore();

  const [currentSettings, setCurrentSettings] = useState<AppSettings>({
    ...settings,
    language: settings.language || Language.EN,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const { t } = useTranslation();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    setCurrentSettings(prev => ({ ...prev, ...settings }));
  }, [settings]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(currentSettings);
    showSnackbar(t.settings_saved_successfully, 'success');
  };

  const handleExport = () => {
    setLoading({ message: t.exporting, variant: 'pulse' });
    setTimeout(() => {
      const data = JSON.stringify({ transactions, categories, settings }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menthabit-data.json';
      a.click();
      URL.revokeObjectURL(url);
      hideLoading();
      showSnackbar('Datos exportados correctamente.', 'success');
    }, 500);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading({ message: t.importing, variant: 'dots' });
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string) as unknown;
        const { ok, error } = validateImportData(raw);
        if (!ok) {
          hideLoading();
          showSnackbar(error ?? t.failed_to_import_data, 'error');
          return;
        }
        setTimeout(() => {
          importData(raw as Parameters<typeof importData>[0]);
          hideLoading();
          showSnackbar(t.data_imported_successfully, 'success');
        }, 1000);
      } catch {
        hideLoading();
        showSnackbar(t.failed_to_import_data, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteAllData = () => {
    if (deleteChecked) {
      setLoading({ message: t.deleting, variant: 'pulse' });
      setTimeout(() => {
        clearAllData();
        hideLoading();
        showSnackbar(t.all_data_deleted_successfully, 'success');
        setIsDeleteModalOpen(false);
        setDeleteChecked(false);
      }, 1500);
    } else {
      showSnackbar(t.please_confirm_data_deletion, 'error');
    }
  };

  return (
    <>
      <div style={{ paddingTop: '4px', maxWidth: '600px' }}>

        {/* ── Profile ────────────────────────────────────────── */}
        <SettingsCard>
          <SectionHeader icon={<User size={15} />} title="Perfil" />
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel htmlFor="userName">{t.user_name || 'Nombre de usuario'}</FieldLabel>
            <input
              id="userName"
              type="text"
              name="userName"
              value={currentSettings.userName}
              onChange={handleInputChange}
              style={fieldInput}
              placeholder="Tu nombre"
              autoComplete="off"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleSave} style={btnGreen}>
              <Save size={14} aria-hidden="true" />
              {t.save_settings || 'Guardar'}
            </button>
          </div>
        </SettingsCard>

        {/* ── Preferences ────────────────────────────────────── */}
        <SettingsCard>
          <SectionHeader icon={<Settings2 size={15} />} title={t.user_preferences || 'Preferencias'} />
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel htmlFor="currency">{t.currency || 'Moneda'}</FieldLabel>
            <select
              id="currency"
              name="currency"
              value={currentSettings.currency}
              onChange={handleSelectChange}
              style={fieldInput}
            >
              {Object.values(Currency).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <FieldLabel htmlFor="language">{t.language || 'Idioma'}</FieldLabel>
            <select
              id="language"
              name="language"
              value={currentSettings.language}
              onChange={handleSelectChange}
              style={fieldInput}
            >
              {Object.values(Language).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleSave} style={btnGreen}>
              <Save size={14} aria-hidden="true" />
              {t.save_settings || 'Guardar'}
            </button>
          </div>
        </SettingsCard>

        {/* ── Data management ────────────────────────────────── */}
        <SettingsCard>
          <SectionHeader icon={<Database size={15} />} title={t.data_management || 'Datos'} />
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.55 }}>
            Exporta tus transacciones como JSON o importa datos de una copia anterior de MentHabit.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleExport} style={btnGhost}>
              <Download size={14} aria-hidden="true" />
              {t.export_data || 'Exportar'}
            </button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              id="import-file"
            />
            <label htmlFor="import-file" style={btnIndigo}>
              <Upload size={14} aria-hidden="true" />
              {t.import_data || 'Importar'}
            </label>
          </div>
        </SettingsCard>

        {/* ── Danger zone ────────────────────────────────────── */}
        <SettingsCard danger>
          <SectionHeader icon={<AlertTriangle size={15} />} title="Zona de riesgo" danger />
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.55 }}>
            Eliminar todos los datos es permanente y no se puede deshacer.
          </p>
          <button type="button" onClick={() => setIsDeleteModalOpen(true)} style={btnDangerOutline}>
            <AlertTriangle size={14} aria-hidden="true" />
            {t.delete_all_data || 'Eliminar todos los datos'}
          </button>
        </SettingsCard>

      </div>

      {/* ── Delete confirmation modal ─────────────────────────── */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsDeleteModalOpen(false)}
          />
          {/* Dialog card */}
          <div style={{
            position: 'relative', zIndex: 1, backgroundColor: '#ffffff',
            borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            padding: '24px', width: '100%', maxWidth: '400px',
          }}>
            {/* Close */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              aria-label="Cerrar"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer',
                color: '#6B7280',
              }}
            >
              <X size={14} />
            </button>
            {/* Icon */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '44px', height: '44px', borderRadius: '14px',
              backgroundColor: 'rgba(239,68,68,0.10)', color: '#EF4444',
              marginBottom: '16px',
            }}>
              <AlertTriangle size={22} />
            </div>
            <h2
              id="delete-modal-title"
              style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' }}
            >
              {t.confirm_delete_all_data || 'Confirmar eliminación'}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.55, margin: '0 0 20px' }}>
              {t.delete_all_data_message}
            </p>
            {/* Confirmation checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={deleteChecked}
                onChange={(e) => setDeleteChecked(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#EF4444', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                {t.i_understand_and_wish_to_continue}
              </span>
            </label>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  height: '40px', padding: '0 16px', borderRadius: '10px',
                  background: 'rgba(0,0,0,0.05)', color: '#374151',
                  border: '1px solid rgba(0,0,0,0.10)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13.5px', fontFamily: 'inherit',
                }}
              >
                {t.cancel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleDeleteAllData}
                style={{
                  height: '40px', padding: '0 16px', borderRadius: '10px',
                  background: '#EF4444', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: '13.5px',
                  fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(239,68,68,0.28)',
                }}
              >
                {t.delete_all_data || 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
