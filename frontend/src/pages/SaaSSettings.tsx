import React, { useEffect, useMemo, useState } from 'react';
import { HiExclamationCircle, HiShieldCheck } from 'react-icons/hi';
import { saasApi } from '../services/api';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  newThisMonth: number;
}

const environmentLabel = import.meta.env.MODE === 'production' ? 'Produccion' : 'Desarrollo';

const SaaSSettings: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await saasApi.get('/saas/stats');
        setStats(response.data.data || { totalTenants: 0, activeTenants: 0, totalRevenue: 0, newThisMonth: 0 });
      } catch {
        setStats({ totalTenants: 0, activeTenants: 0, totalRevenue: 0, newThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const systemCards = useMemo(
    () => [
      { label: 'Entorno', value: environmentLabel, note: 'Lectura local del frontend' },
      { label: 'API base', value: import.meta.env.VITE_API_URL || 'Proxy local /api/v1', note: 'Fuente actual del panel' },
      { label: 'Tenants', value: stats.totalTenants, note: `${stats.activeTenants} activos` },
      { label: 'Nuevos este mes', value: stats.newThisMonth, note: 'Alta reciente en master DB' },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Configuracion</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Estado del panel SaaS</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Esta pantalla ya no simula un formulario persistente. Hoy funciona como un panel de lectura para entorno,
          alcance actual y decisiones pendientes del panel maestro.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {systemCards.map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <HiShieldCheck className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-950">Alcance real del modulo</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Lo que ya opera</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• autenticacion de super admin</li>
                <li>• dashboard SaaS y bandeja de tenants</li>
                <li>• detalle de tenant con usuarios, billing, backups y auditoria</li>
                <li>• facturacion SaaS con generacion y registro de pago</li>
                <li>• productos del website</li>
              </ul>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Lo que aun falta cerrar</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• restaurar backup desde UI</li>
                <li>• reprovisionar tenant fallido</li>
                <li>• crear usuario del tenant desde SaaS</li>
                <li>• lifecycle mas rico: trial, mora, archivado</li>
                <li>• ajustes SaaS persistentes si realmente se necesitan</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 text-amber-800">
              <HiExclamationCircle className="h-5 w-5" />
              <h2 className="text-base font-semibold">Decision de producto</h2>
            </div>
            <p className="mt-4 text-sm text-amber-800/90">
              Si quieres una configuracion SaaS editable, hay que modelarla y persistirla en backend. Mantener un formulario
              local sin guardar solo introduce ruido y expectativas falsas.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Sistema</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Frontend</span>
                <span className="font-medium text-slate-950">React + Vite</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Backend</span>
                <span className="font-medium text-slate-950">Express + Prisma</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Base de datos</span>
                <span className="font-medium text-slate-950">PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fecha</span>
                <span className="font-medium text-slate-950">12 de marzo de 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SaaSSettings;
