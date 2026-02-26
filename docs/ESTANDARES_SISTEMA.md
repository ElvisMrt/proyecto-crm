# 📐 Estándares del Sistema CRM

## 🎨 Paleta de Colores Estandarizada

### Colores Primarios
- **Azul (Primary)**: `bg-blue-600`, `text-blue-600` - Acciones principales, links
- **Verde (Success)**: `bg-green-600`, `text-green-600` - Éxito, confirmaciones
- **Rojo (Error/Danger)**: `bg-red-600`, `text-red-600` - Errores, eliminaciones
- **Naranja (Warning)**: `bg-orange-600`, `text-orange-600` - Advertencias
- **Morado (Purple)**: `bg-purple-600`, `text-purple-600` - Estadísticas adicionales

### Colores de Texto
- **Primario**: `text-gray-900` - Títulos, texto principal
- **Secundario**: `text-gray-500` - Subtítulos, descripciones
- **Muted**: `text-gray-400` - Texto auxiliar

### Colores de Fondo
- **Blanco**: `bg-white` - Tarjetas, modales
- **Gris claro**: `bg-gray-50` - Headers de tablas, fondos alternos
- **Gris muy claro**: `bg-gray-100` - Hover states

---

## 🔘 Botones Estandarizados

### Botón Primario
```tsx
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
```

### Botón Secundario
```tsx
className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
```

### Botón Peligro
```tsx
className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
```

### Botón Outline
```tsx
className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
```

---

## 📝 Inputs Estandarizados

### Input Normal
```tsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
```

### Input con Error
```tsx
className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
```

### Input Deshabilitado
```tsx
className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
```

---

## 🏷️ Badges Estandarizados

### Success
```tsx
className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"
```

### Error
```tsx
className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800"
```

### Warning
```tsx
className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800"
```

### Info
```tsx
className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
```

### Neutral
```tsx
className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800"
```

---

## 📊 Tablas Estandarizadas

### Estructura de Tabla
```tsx
<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Columna
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50">
          <td className="px-4 py-3 whitespace-nowrap text-sm">
            Dato
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Padding de Celdas
- **Header**: `px-4 py-3`
- **Body**: `px-4 py-3`

### Tamaños de Texto
- **Header**: `text-xs uppercase`
- **Body**: `text-sm`

---

## 🔔 Alertas/Mensajes Estandarizados

### Alerta de Éxito
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-3">
  <div className="flex items-start space-x-2">
    <HiCheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-medium text-green-800">Título</p>
      <p className="text-xs text-green-700 mt-1">Mensaje</p>
    </div>
  </div>
</div>
```

### Alerta de Error
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-3">
  <div className="flex items-start space-x-2">
    <HiXCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-medium text-red-800">Título</p>
      <p className="text-xs text-red-700 mt-1">Mensaje</p>
    </div>
  </div>
</div>
```

### Alerta de Advertencia
```tsx
<div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
  <div className="flex items-start space-x-2">
    <HiExclamationCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-medium text-orange-800">Título</p>
      <p className="text-xs text-orange-700 mt-1">Mensaje</p>
    </div>
  </div>
</div>
```

---

## 🪟 Modales Estandarizados

### Estructura de Modal
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 w-full max-w-md">
    <h2 className="text-lg font-bold mb-4">Título</h2>
    <form className="space-y-4">
      {/* Contenido */}
    </form>
    <div className="flex space-x-3 pt-4">
      <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        Cancelar
      </button>
      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Confirmar
      </button>
    </div>
  </div>
</div>
```

### Tamaños de Modal
- **Pequeño**: `max-w-sm`
- **Mediano**: `max-w-md` (por defecto)
- **Grande**: `max-w-lg`
- **Extra Grande**: `max-w-xl`

---

## 📑 Tabs Estandarizados

### Estructura de Tabs
```tsx
<div className="border-b border-gray-200">
  <nav className="-mb-px flex space-x-4 overflow-x-auto">
    <button className="py-3 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-xs whitespace-nowrap">
      <span className="inline-flex items-center">
        <Icon className="w-4 h-4 mr-1.5" />
        <span>Tab Activo</span>
      </span>
    </button>
    <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-xs whitespace-nowrap">
      <span className="inline-flex items-center">
        <Icon className="w-4 h-4 mr-1.5" />
        <span>Tab Inactivo</span>
      </span>
    </button>
  </nav>
</div>
```

---

## 📐 Espaciado Estandarizado

### Padding de Páginas
- **Desktop**: `p-6`
- **Mobile**: `p-4`
- **Responsive**: `p-4 md:p-6`

### Gap entre Elementos
- **Pequeño**: `gap-2` o `space-y-2`
- **Mediano**: `gap-3` o `space-y-3` (por defecto)
- **Grande**: `gap-4` o `space-y-4`

### Margin Bottom
- **Secciones**: `mb-4`
- **Headers**: `mb-4`
- **Entre grupos**: `mb-6`

---

## 🎯 Headers Estandarizados

### Header de Página
```tsx
<div className="mb-4">
  <h1 className="text-xl font-bold text-gray-900">Título</h1>
  <p className="text-sm text-gray-500">Descripción</p>
</div>
```

### Header con Acción
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    <h1 className="text-xl font-bold text-gray-900">Título</h1>
    <p className="text-sm text-gray-500">Descripción</p>
  </div>
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
    Acción
  </button>
</div>
```

---

## 📦 Tarjetas Minimalistas (MinimalStatCard)

### Uso
```tsx
<MinimalStatCard
  title="Título"
  value="100"
  subtitle="subtítulo opcional"
  icon={<HiIcon className="w-full h-full" />}
  color="blue"
  href="/ruta-opcional"
/>
```

### Colores Disponibles
- `blue`, `green`, `red`, `orange`, `purple`, `yellow`

---

## ✅ Componentes Reutilizables Creados

1. **StandardAlert** - Alertas/mensajes estandarizados
2. **StandardTable** - Tablas con diseño consistente
3. **StandardModal** - Modales estandarizados
4. **MinimalStatCard** - Tarjetas de estadísticas compactas
5. **standardColors.ts** - Paleta de colores centralizada
6. **standardButtons** - Clases de botones predefinidas
7. **standardInputs** - Clases de inputs predefinidas
8. **standardBadges** - Clases de badges predefinidas

---

## 🎨 Iconos Estandarizados

Usar **react-icons/hi** (Heroicons) en todo el sistema:

```tsx
import { HiIcon } from 'react-icons/hi';
```

### Tamaños de Iconos
- **Pequeño**: `w-4 h-4` - Tabs, badges, texto inline
- **Mediano**: `w-5 h-5` - Botones, headers
- **Grande**: `w-6 h-6` - Tarjetas destacadas

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Por defecto
- **Tablet**: `md:` (768px)
- **Desktop**: `lg:` (1024px)

### Grids Responsive
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
```

---

## ⚡ Transiciones

Todas las interacciones deben tener transiciones suaves:

```tsx
className="transition-colors"
```

---

**Usar estos estándares en TODOS los módulos del sistema para mantener consistencia visual y UX.**
