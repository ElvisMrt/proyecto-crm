import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api';

const RolesTab = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        settingsApi.getRoles(),
        settingsApi.getPermissions(),
      ]);
      setRoles(rolesResponse.data || []);
      setPermissions(permissionsResponse.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (roleId: string) => {
    const descriptions: any = {
      ADMINISTRATOR: 'Acceso completo al sistema. Puede gestionar usuarios, configuración y todas las operaciones.',
      SUPERVISOR: 'Supervisión y gestión operativa. Acceso a reportes y configuración limitada.',
      OPERATOR: 'Operaciones diarias: ventas, cobros, caja e inventario. Sin acceso a configuración.',
      CASHIER: 'Operaciones de caja y ventas básicas. Acceso limitado a otras funciones.',
    };
    return descriptions[roleId] || '';
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Roles del Sistema</h2>
        <p className="text-sm text-gray-600">
          Los roles agrupan permisos. Los usuarios heredan los permisos de sus roles asignados.
        </p>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{role.description || getRoleDescription(role.id)}</p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                {role.id}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500">
                {role.permissions === 'all'
                  ? 'Todos los permisos'
                  : `${role.permissions} permisos`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions by Module */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permisos por Módulo</h3>
        <div className="space-y-4">
          {Object.entries(permissions).map(([module, perms]: [string, any]) => (
            <div key={module} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 capitalize">
                {module === 'crm' ? 'CRM' : module}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {perms.map((perm: any) => (
                  <div key={perm.key} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {perm.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Los permisos se asignan a los roles, no directamente a los usuarios.
          Para modificar los permisos de un rol, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
};

export default RolesTab;



