# Implementación de NFC en el Sistema CRM

## 📱 **Funcionalidad NFC Implementada**

El sistema ahora soporta lectura de tarjetas NFC en todos los módulos relevantes para búsqueda rápida de productos y códigos.

## 🔧 **Componentes Creados**

### 1. **Hook `useNFC`** (`/frontend/src/hooks/useNFC.ts`)

Hook reutilizable para lectura de tarjetas NFC:

```typescript
import { useNFC, useNFCSearch } from '../hooks/useNFC';

// Uso básico
const { isSupported, isReading, error } = useNFC({
  onRead: (data) => {
    console.log('NFC data:', data);
  },
  enabled: true
});

// Uso simplificado para búsqueda
const { isSupported, isReading } = useNFCSearch(
  (code) => {
    // Código detectado
    setSearch(code);
  },
  true // enabled
);
```

**Características:**
- ✅ Detección automática de soporte NFC
- ✅ Lectura de registros de texto y URL
- ✅ Manejo de errores
- ✅ Control de activación/desactivación
- ✅ Auto-inicio cuando está habilitado

### 2. **Componente `NFCIndicator`** (`/frontend/src/components/NFCIndicator.tsx`)

Indicador visual del estado de NFC:

```typescript
import { NFCIndicator } from '../components/NFCIndicator';

<NFCIndicator 
  isSupported={nfcSupported}
  isReading={nfcReading}
/>
```

**Estados visuales:**
- 🟢 **Verde pulsante** - NFC activo y leyendo
- ⚪ **Gris** - NFC soportado pero inactivo
- **Oculto** - NFC no soportado en el dispositivo

## 📦 **Módulos con NFC Implementado**

### ✅ **Punto de Venta (POS)**
**Ubicación:** `/frontend/src/components/sales/POSTab.tsx`

**Funcionalidad:**
- Búsqueda automática de productos por código NFC
- Agregado automático al carrito si hay coincidencia exacta
- Indicador visual de estado NFC
- Toast de confirmación al agregar producto

**Uso:**
1. Acercar tarjeta NFC con código de producto
2. El sistema busca automáticamente el producto
3. Si encuentra coincidencia exacta, lo agrega al carrito
4. Muestra notificación de éxito

## 🎯 **Módulos Pendientes de Implementación**

Para expandir NFC a otros módulos, seguir este patrón:

### **Inventario - Productos**
```typescript
import { useNFCSearch } from '../../hooks/useNFC';
import { NFCIndicator } from '../../components/NFCIndicator';

// En el componente
const { isSupported: nfcSupported, isReading: nfcReading } = useNFCSearch(
  (code) => {
    setFilters({ ...filters, search: code });
  },
  true
);

// En el JSX
<NFCIndicator isSupported={nfcSupported} isReading={nfcReading} />
```

### **Inventario - Stock**
Similar al POS, buscar productos por código para consultar existencias.

### **Inventario - Movimientos**
Búsqueda rápida de productos para ver su kardex.

## 🌐 **Compatibilidad de Navegadores**

**NFC Web API** está disponible en:
- ✅ Chrome/Edge (Android) - Versión 89+
- ✅ Samsung Internet (Android)
- ❌ Safari (iOS) - No soportado
- ❌ Firefox - No soportado

**Nota:** El sistema detecta automáticamente si NFC está disponible y solo muestra el indicador en dispositivos compatibles.

## 📝 **Formato de Tarjetas NFC**

El sistema lee los siguientes tipos de registros NDEF:

1. **Text Record** - Texto plano (UTF-8)
2. **URL Record** - URLs
3. **Serial Number** - Número de serie de la tarjeta (fallback)

**Recomendación:** Grabar códigos de producto como registros de texto simple.

## 🔒 **Permisos**

La API NFC requiere:
- Contexto HTTPS (o localhost para desarrollo)
- Permiso del usuario al primer uso
- Pestaña activa del navegador

## 🚀 **Próximos Pasos**

1. ✅ Implementar en módulo de Inventario
2. ✅ Agregar en módulo de Compras
3. ✅ Incluir en Registro de Pagos
4. ✅ Documentar formato de tarjetas NFC recomendado
5. ✅ Crear guía de grabación de tarjetas NFC

## 📖 **Ejemplo de Uso Completo**

```typescript
import { useState } from 'react';
import { useNFCSearch } from '../hooks/useNFC';
import { NFCIndicator } from '../components/NFCIndicator';

const MyComponent = () => {
  const [search, setSearch] = useState('');
  
  const { isSupported, isReading } = useNFCSearch(
    (code) => {
      setSearch(code);
      // Buscar producto con el código
      searchProduct(code);
    },
    true // Siempre activo
  );

  return (
    <div>
      <div className="flex gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código..."
        />
        <NFCIndicator 
          isSupported={isSupported}
          isReading={isReading}
        />
      </div>
    </div>
  );
};
```

## ⚠️ **Consideraciones Importantes**

1. **Seguridad:** Solo funciona en HTTPS
2. **UX:** Informar al usuario sobre el estado de NFC
3. **Fallback:** Siempre mantener búsqueda manual disponible
4. **Performance:** La lectura NFC no afecta el rendimiento del sistema
5. **Compatibilidad:** Verificar soporte antes de mostrar funcionalidad

---

**Última actualización:** Febrero 2026
**Estado:** ✅ Implementado en POS, listo para expansión
