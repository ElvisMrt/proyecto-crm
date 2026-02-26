# Estructura de Módulos del Sistema CRM

## 📋 **Módulos Principales**

### ✅ **1. Dashboard** (`/dashboard`)
- Vista general del sistema
- KPIs principales
- Acceso rápido a módulos

### ✅ **2. Ventas** (`/sales`)
Dashboard con tabs:
- **POS** - Punto de venta
- **Facturas** - Gestión de facturas
- **Cotizaciones** - Gestión de cotizaciones
- **Notas de Crédito** - Gestión de NC
- **Canceladas** - Facturas canceladas

### ✅ **3. Cuentas por Cobrar** (`/receivables`)
Dashboard con tabs:
- **Estado de Cuenta** - Consulta por cliente
- **Registro de Pagos** - Registrar pagos
- **Facturas Vencidas** - Gestión de vencimientos
- **Historial de Pagos** - Historial completo
- **Resumen de CxC** - Estadísticas

### ✅ **4. Proveedores y Compras** (`/suppliers-dashboard`)
Dashboard con tabs:
- **Dashboard** - Vista general con KPIs
- **Proveedores** - CRUD de proveedores
- **Compras** - CRUD de órdenes de compra
- **Facturas** - CRUD de facturas de proveedores
- **Pagos** - CRUD de pagos a proveedores

**Características:**
- ✅ Código automático de proveedores (PROV0001, PROV0002, etc.)
- ✅ CRUD completo en todos los submódulos
- ✅ Navegación por tabs
- ✅ Sin duplicación de módulos

### ✅ **5. Caja** (`/cash`)
Dashboard con tabs:
- **Abrir Caja** - Apertura de caja
- **Movimientos** - Registro de movimientos
- **Cerrar Caja** - Cierre de caja
- **Historial** - Historial de cajas
- **Resumen** - Estadísticas

### ✅ **6. Inventario** (`/inventory`)
Dashboard con tabs:
- **Productos** - CRUD de productos
- **Categorías** - CRUD de categorías
- **Stock** - Consulta de existencias
- **Movimientos** - Kardex
- **Ajustes** - Ajustes de inventario
- **Alertas** - Alertas de stock bajo

### ✅ **7. Clientes** (`/clients`)
- CRUD de clientes
- Gestión de información

### ✅ **8. CRM** (`/crm`)
Dashboard con tabs:
- **Tareas** - Gestión de tareas
- **Tareas Vencidas** - Tareas pendientes
- **Historial de Cliente** - Vista 360°
- **Citas** - Gestión de citas

### ✅ **9. Reportes** (`/reports`)
Dashboard con tabs:
- **Resumen** - Vista general
- **Ventas** - Reportes de ventas
- **Cuentas por Cobrar** - Reportes de CxC
- **Caja** - Reportes de caja
- **Inventario** - Reportes de inventario
- **¿Cuánto gané hoy?** - Utilidad diaria

### ✅ **10. Configuración** (`/settings`)
- Configuración general del sistema

## 🎯 **Patrón de Diseño Implementado**

### **Dashboard con Tabs**
Todos los módulos principales usan el patrón de dashboard con tabs:

```tsx
const [activeTab, setActiveTab] = useState<TabType>('dashboard');

// Tabs horizontales
<nav className="flex space-x-1">
  {tabs.map(tab => (
    <button onClick={() => setActiveTab(tab.id)}>
      {tab.label}
    </button>
  ))}
</nav>

// Contenido del tab activo
{activeTab === 'dashboard' && <DashboardContent />}
{activeTab === 'suppliers' && <Suppliers />}
```

### **Ventajas del Patrón**
- ✅ **Un solo punto de acceso** por módulo
- ✅ **Navegación intuitiva** con tabs
- ✅ **Sin duplicación** de código
- ✅ **Contexto preservado** al cambiar tabs
- ✅ **Mejor UX** - Todo en un lugar

## 🔧 **Funcionalidad CRUD**

### **Todos los módulos incluyen:**
1. **Create** - Crear nuevos registros
2. **Read** - Listar y consultar registros
3. **Update** - Editar registros existentes
4. **Delete** - Eliminar registros

### **Características Comunes:**
- ✅ Modales para crear/editar
- ✅ Confirmación antes de eliminar
- ✅ Validación de formularios
- ✅ Mensajes de error/éxito
- ✅ Actualización automática de listas

## 🎨 **Diseño Estandarizado**

### **Colores Hex Aplicados:**
- **#000000** - Negro (títulos, valores importantes)
- **#1D79C4** - Azul (color primario, botones, enlaces)
- **#1f2937** - Gris oscuro (texto secundario, labels)

### **Componentes Estandarizados:**
- `MinimalStatCard` - Tarjetas de KPIs
- `MinimalActionCard` - Tarjetas de acciones rápidas
- `StandardTable` - Tablas consistentes
- `StandardModal` - Modales uniformes
- `StandardAlert` - Alertas estandarizadas
- `NFCIndicator` - Indicador de NFC

## 📱 **Funcionalidades Especiales**

### **NFC (Near Field Communication)**
- ✅ Implementado en POS
- ✅ Hook reutilizable `useNFC`
- ✅ Búsqueda automática de productos
- ✅ Indicador visual de estado

### **Código Automático**
- ✅ Proveedores: PROV0001, PROV0002, etc.
- ✅ Generación secuencial
- ✅ Opcional (puede ser manual)

### **Búsqueda de Clientes**
- ✅ Dropdown al hacer click
- ✅ Muestra todos los clientes
- ✅ Filtrado en tiempo real
- ✅ Navegación con teclado

## 🚀 **Rutas del Sistema**

### **Principales:**
```
/dashboard              - Dashboard principal
/sales                  - Ventas (con tabs)
/receivables            - Cuentas por Cobrar (con tabs)
/suppliers-dashboard    - Proveedores y Compras (con tabs)
/cash                   - Caja (con tabs)
/inventory              - Inventario (con tabs)
/clients                - Clientes
/crm                    - CRM (con tabs)
/reports                - Reportes (con tabs)
/settings               - Configuración
```

### **Rutas Eliminadas (Duplicadas):**
```
❌ /suppliers           - Eliminado (ahora es tab en suppliers-dashboard)
```

## ✅ **Estado del Sistema**

- ✅ **Sin duplicación de módulos**
- ✅ **CRUD completo en todos los módulos**
- ✅ **Diseño estandarizado**
- ✅ **Colores consistentes**
- ✅ **Navegación por tabs**
- ✅ **NFC implementado**
- ✅ **Búsquedas mejoradas**

---

**Última actualización:** Febrero 2026
**Estado:** ✅ Sistema completamente funcional y estandarizado
