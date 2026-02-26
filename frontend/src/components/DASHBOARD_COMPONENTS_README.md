# Componentes Reutilizables de Dashboard

Esta guía explica cómo usar los componentes estandarizados de dashboard para mantener una estética consistente en todos los módulos del CRM.

## 📦 Componentes Disponibles

### 1. DashboardCard

Tarjeta KPI con icono, valor principal, subtítulo opcional y tendencia.

```tsx
import { DashboardCard } from '../components/DashboardCard';
import { HiShoppingCart } from 'react-icons/hi';

<DashboardCard
  title="Ventas del Mes"
  value={formatCurrency(25000)}
  subtitle="150 facturas"
  icon={<HiShoppingCart className="w-6 h-6" />}
  iconBgColor="bg-blue-100"
  iconColor="text-blue-600"
  trend={{
    value: 12.5,
    isPositive: true,
    label: "vs mes pasado"
  }}
  onClick={() => navigate('/sales')}
/>
```

**Props:**
- `title` (string): Título de la tarjeta
- `value` (string | number): Valor principal a mostrar
- `subtitle?` (string): Texto secundario opcional
- `icon` (ReactNode): Icono a mostrar
- `iconBgColor` (string): Color de fondo del icono (ej: "bg-blue-100")
- `iconColor` (string): Color del icono (ej: "text-blue-600")
- `trend?` (object): Objeto con tendencia opcional
  - `value` (number): Porcentaje de cambio
  - `isPositive` (boolean): Si es positivo o negativo
  - `label?` (string): Etiqueta personalizada
- `onClick?` (function): Función al hacer clic

### 2. DashboardSection

Contenedor con título y acción opcional para secciones del dashboard.

```tsx
import { DashboardSection } from '../components/DashboardCard';

<DashboardSection
  title="Análisis de Ventas"
  action={{
    label: 'Ver todo',
    onClick: () => navigate('/sales')
  }}
>
  {/* Contenido de la sección */}
  <div>Tu contenido aquí</div>
</DashboardSection>
```

**Props:**
- `title` (string): Título de la sección
- `children` (ReactNode): Contenido de la sección
- `action?` (object): Acción opcional en la esquina superior derecha
  - `label` (string): Texto del botón
  - `onClick` (function): Función al hacer clic
- `className?` (string): Clases CSS adicionales

### 3. DashboardHeader

Encabezado del dashboard con título, subtítulo y acciones.

```tsx
import { DashboardHeader, DashboardButton } from '../components/DashboardCard';
import { HiPlus } from 'react-icons/hi';

<DashboardHeader
  title="Dashboard de Ventas"
  subtitle="Gestiona tus ventas y facturas"
  actions={
    <>
      <DashboardButton
        label="Nueva Venta"
        icon={<HiPlus className="w-5 h-5" />}
        onClick={() => navigate('/sales/new')}
        variant="primary"
      />
      <DashboardButton
        label="Exportar"
        onClick={() => handleExport()}
        variant="secondary"
      />
    </>
  }
/>
```

**Props:**
- `title` (string): Título principal
- `subtitle?` (string): Subtítulo opcional
- `actions?` (ReactNode): Botones de acción

### 4. DashboardButton

Botón estilizado para acciones del dashboard.

```tsx
import { DashboardButton } from '../components/DashboardCard';
import { HiPlus } from 'react-icons/hi';

<DashboardButton
  label="Nueva Factura"
  icon={<HiPlus className="w-5 h-5" />}
  onClick={() => navigate('/sales/new-invoice')}
  variant="primary"
/>
```

**Props:**
- `label` (string): Texto del botón
- `icon?` (ReactNode): Icono opcional
- `onClick` (function): Función al hacer clic
- `variant?` ('primary' | 'secondary'): Estilo del botón (default: 'primary')

### 5. DashboardGrid

Grid responsive para organizar tarjetas KPI.

```tsx
import { DashboardGrid } from '../components/DashboardCard';

<DashboardGrid columns={4}>
  <DashboardCard {...} />
  <DashboardCard {...} />
  <DashboardCard {...} />
  <DashboardCard {...} />
</DashboardGrid>
```

**Props:**
- `children` (ReactNode): Tarjetas a mostrar
- `columns?` (1 | 2 | 3 | 4): Número de columnas (default: 4)

## 🎨 Paleta de Colores Estándar

Para mantener consistencia, usa estos colores para los iconos:

### Colores Principales
- **Azul** (Ventas/General): `bg-blue-100` + `text-blue-600`
- **Verde** (Éxito/Completado): `bg-green-100` + `text-green-600`
- **Naranja** (Advertencia/Pendiente): `bg-orange-100` + `text-orange-600`
- **Rojo** (Error/Vencido): `bg-red-100` + `text-red-600`
- **Púrpura** (Tareas/CRM): `bg-purple-100` + `text-purple-600`
- **Amarillo** (Alertas): `bg-yellow-100` + `text-yellow-600`
- **Gris** (Neutral): `bg-gray-100` + `text-gray-600`

### Iconos Recomendados por Módulo

```tsx
import {
  HiShoppingCart,      // Ventas
  HiCurrencyDollar,    // Finanzas/Cobros
  HiCheckCircle,       // Completado/Éxito
  HiClipboardCheck,    // Tareas
  HiCash,              // Caja
  HiCube,              // Inventario/Productos
  HiUsers,             // Clientes
  HiChartBar,          // Reportes/Análisis
  HiOfficeBuilding,    // Sucursales
  HiDocumentText,      // Documentos/Facturas
} from 'react-icons/hi';
```

## 📋 Ejemplo Completo: Dashboard de Inventario

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DashboardCard,
  DashboardSection,
  DashboardHeader,
  DashboardButton,
  DashboardGrid,
} from '../components/DashboardCard';
import {
  HiCube,
  HiTrendingDown,
  HiPlus,
  HiExclamation,
} from 'react-icons/hi';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Dashboard de Inventario"
        subtitle="Gestiona tus productos y stock"
        actions={
          <>
            <DashboardButton
              label="Nuevo Producto"
              icon={<HiPlus className="w-5 h-5" />}
              onClick={() => navigate('/inventory/new')}
              variant="primary"
            />
            <DashboardButton
              label="Ajuste de Stock"
              onClick={() => navigate('/inventory/adjustment')}
              variant="secondary"
            />
          </>
        }
      />

      {/* KPI Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Productos"
          value={stats?.totalProducts || 0}
          icon={<HiCube className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          onClick={() => navigate('/inventory')}
        />
        <DashboardCard
          title="Valor del Inventario"
          value={formatCurrency(stats?.totalValue || 0)}
          icon={<HiCurrencyDollar className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <DashboardCard
          title="Stock Bajo"
          value={stats?.lowStock || 0}
          subtitle="Requieren atención"
          icon={<HiTrendingDown className="w-6 h-6" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          onClick={() => navigate('/inventory?filter=low-stock')}
        />
        <DashboardCard
          title="Sin Stock"
          value={stats?.outOfStock || 0}
          subtitle="Productos agotados"
          icon={<HiExclamation className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          onClick={() => navigate('/inventory?filter=out-of-stock')}
        />
      </DashboardGrid>

      {/* Secciones adicionales */}
      <DashboardSection
        title="Productos con Stock Bajo"
        action={{
          label: 'Ver todos',
          onClick: () => navigate('/inventory?filter=low-stock')
        }}
      >
        {/* Tu contenido aquí */}
      </DashboardSection>
    </div>
  );
};

export default InventoryDashboard;
```

## ✅ Checklist para Implementar Dashboard

Cuando crees un dashboard para un módulo nuevo:

1. ✅ Usar `DashboardHeader` para el encabezado
2. ✅ Usar `DashboardGrid` con 4 columnas para KPIs
3. ✅ Usar `DashboardCard` para cada métrica
4. ✅ Mantener paleta de colores consistente
5. ✅ Agregar `onClick` a las tarjetas para navegación
6. ✅ Usar `DashboardSection` para secciones de contenido
7. ✅ Agregar botones de acción con `DashboardButton`
8. ✅ Espaciado consistente: `space-y-6` en el contenedor principal

## 🚀 Módulos que Deben Usar Este Diseño

- ✅ Dashboard Principal (ya implementado)
- ⏳ Dashboard de Ventas
- ⏳ Dashboard de Inventario
- ⏳ Dashboard de CRM
- ⏳ Dashboard de Cuentas por Cobrar
- ⏳ Dashboard de Caja
- ⏳ Dashboard de Reportes

## 📝 Notas Importantes

- **Consistencia**: Todos los dashboards deben usar estos componentes
- **Responsive**: Los componentes son responsive por defecto
- **Accesibilidad**: Incluyen atributos ARIA apropiados
- **Performance**: Optimizados para renderizado rápido
- **Mantenibilidad**: Cambios en el diseño se hacen en un solo lugar

---

**Última actualización**: Febrero 2026
