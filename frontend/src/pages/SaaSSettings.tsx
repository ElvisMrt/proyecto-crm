import { useState } from 'react';

const SaaSSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'Neypier SaaS',
    supportEmail: 'soporte@neypier.com',
    maxTenantsPerPlan: {
      basic: 100,
      pro: 500,
      enterprise: 1000,
    },
    maintenanceMode: false,
    allowNewSignups: true,
  });

  const handleSave = () => {
    console.log('Guardando configuración:', settings);
    // TODO: Implementar guardado en backend
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Configuración general del panel SaaS Admin</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Información General */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Soporte
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Límites por Plan */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Límites por Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Básico
              </label>
              <input
                type="number"
                value={settings.maxTenantsPerPlan.basic}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTenantsPerPlan: {
                      ...settings.maxTenantsPerPlan,
                      basic: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Pro
              </label>
              <input
                type="number"
                value={settings.maxTenantsPerPlan.pro}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTenantsPerPlan: {
                      ...settings.maxTenantsPerPlan,
                      pro: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Enterprise
              </label>
              <input
                type="number"
                value={settings.maxTenantsPerPlan.enterprise}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTenantsPerPlan: {
                      ...settings.maxTenantsPerPlan,
                      enterprise: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Opciones del Sistema */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opciones del Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Modo Mantenimiento</label>
                <p className="text-sm text-gray-500">
                  Deshabilita el acceso de todos los tenants temporalmente
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Permitir Nuevos Registros</label>
                <p className="text-sm text-gray-500">
                  Permite que nuevos tenants se registren en el sistema
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, allowNewSignups: !settings.allowNewSignups })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowNewSignups ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowNewSignups ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="border-t pt-6 flex justify-end space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Versión:</span>
            <span className="ml-2 font-medium">1.0.0</span>
          </div>
          <div>
            <span className="text-gray-600">Entorno:</span>
            <span className="ml-2 font-medium">Desarrollo</span>
          </div>
          <div>
            <span className="text-gray-600">Base de Datos:</span>
            <span className="ml-2 font-medium">PostgreSQL</span>
          </div>
          <div>
            <span className="text-gray-600">Última Actualización:</span>
            <span className="ml-2 font-medium">Febrero 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaaSSettings;
