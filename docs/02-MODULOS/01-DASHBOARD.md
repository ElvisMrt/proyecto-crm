# Módulo: Dashboard

## 🎯 Objetivo del Módulo

Proporcionar una vista ejecutiva centralizada que muestre:
- **KPIs críticos** del negocio
- **Alertas importantes** que requieren atención
- **Tendencias** de ventas y operaciones
- **Accesos rápidos** a funciones principales
- **Actividad reciente** del sistema

Este módulo responde a: *"¿Cómo está mi negocio hoy?"*

---

## 📊 Componentes del Dashboard

### 1. KPIs Principales (Cards Superiores)

#### 1.1 Ventas del Día
- **Métrica:** Total de ventas del día actual
- **Formato:** RD$ XX,XXX
- **Badge de tendencia:** Porcentaje vs día anterior (↑ verde si positivo, ↓ rojo si negativo)
- **Acción rápida:** Click para ver detalle del día

#### 1.2 Ventas del Mes
- **Métrica:** Total acumulado del mes actual
- **Formato:** RD$ XX,XXX
- **Barra de progreso:** % del objetivo mensual (si está configurado)
- **Acción rápida:** Click para ver reporte mensual

#### 1.3 Cuentas por Cobrar
- **Métrica:** Total pendiente por cobrar
- **Formato:** RD$ XX,XXX
- **Badge:** Número de facturas vencidas (si > 0, color alerta)
- **Acción rápida:** Click para ir a CxC

#### 1.4 Caja Sucursal [X]
- **Métrica:** Balance actual de caja
- **Formato:** RD$ XX,XXX
- **Badge de estado:** "Abierta" (verde) / "Cerrada" (gris)
- **Información adicional:** Hora de apertura
- **Acción rápida:** Click para ir a Caja

---

### 2. Alertas Críticas

#### Panel de Alertas (Izquierda)

**2.1 Facturas Vencidas**
- **Icono:** ⚠️ (rojo)
- **Contenido:** "X facturas vencidas"
- **Acción:** Link "Ver" → Módulo CxC / Facturas Vencidas

**2.2 NCF por Agotarse**
- **Icono:** ⚠️ (amarillo)
- **Contenido:** "X restantes" + Sucursal
- **Acción:** Link "Ver" → Configuración / NCF

**2.3 Caja Sin Cerrar (Ayer)**
- **Icono:** 💰 (azul)
- **Contenido:** "Sucursal X"
- **Acción:** Link "Ver" → Módulo Caja / Cierre

---

### 3. Acciones Rápidas

#### Panel de Acciones (Derecha)

**Botones principales:**
- **+ Nueva Venta** (Azul) → Módulo Ventas / Crear
- **Cobrar** (Verde) → Módulo CxC / Registrar Pago
- **Cierre de Caja** (Amarillo) → Módulo Caja / Cerrar
- **Crear Tarea** (Azul oscuro) → Módulo CRM / Nueva Tarea

**Alertas secundarias:**
- **Stock Crítico:** X productos bajo stock mínimo
- **Tareas Vencidas:** X tareas sin completar

---

### 4. Gráfico de Ventas

#### Ventas de los Últimos 7 Días
- **Tipo:** Gráfico de líneas
- **Eje X:** Días (Últimos 7 días)
- **Eje Y:** Monto en RD$
- **Interactividad:**
  - Tooltip al hover mostrando fecha y monto
  - Selector de período: "Últimos 7 días", "Últimos 30 días", "Este mes"
- **Acción:** Click en punto para ver detalle del día

---

### 5. Actividad Reciente

#### Tabla de Actividad
**Columnas:**
- **Fecha:** Fecha y hora del evento
- **Tipo:** Factura, Pago, Ajuste Inv., etc.
- **Referencia:** Número de documento
- **Monto:** RD$ XX,XXX (si aplica)

**Características:**
- Máximo 10 registros visibles
- Link "Ver todo" → Log de actividad completo
- Filtro opcional por tipo de actividad

---

## 🔐 Permisos y Acceso

### Niveles de Acceso

- **Administrador:** Ve todos los KPIs y alertas
- **Supervisor:** Ve KPIs relevantes, puede ver alertas
- **Operador/Cajero:** Vista limitada (solo sus métricas si aplica)

**Regla:** Los datos mostrados respetan los permisos del usuario según su rol.

---

## 🔗 Integración con Otros Módulos

El Dashboard **lee** datos de:
- **Ventas:** Para calcular totales y tendencias
- **Cuentas por Cobrar:** Para mostrar pendientes y vencidos
- **Caja:** Para mostrar estado actual
- **Inventario:** Para alertas de stock
- **CRM:** Para tareas vencidas

**Importante:** El Dashboard **NO modifica** datos, solo los presenta.

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Layout de 2 columnas para alertas/acciones
- Gráfico de tamaño completo
- Tabla de actividad expandida

### Tablet (768px - 1024px)
- Layout de 1 columna
- Gráfico responsive
- Tabla con scroll horizontal

### Mobile (< 768px)
- Cards apiladas verticalmente
- Gráfico simplificado
- Tabla con paginación o cards

---

## 🔄 Actualización de Datos

### Estrategia de Refresh

- **Tiempo real:** Para estado de caja (WebSocket opcional)
- **Polling cada 5 minutos:** Para KPIs y alertas
- **On-demand:** Refresh manual con botón de actualizar
- **Cache:** Los datos se cachean en frontend para evitar llamadas excesivas

---

## 📝 Notas de Implementación

1. **Performance:** Los KPIs deben calcularse eficientemente, preferiblemente con índices en BD y vistas materializadas si es necesario.

2. **Personalización:** (Fase futura) Permitir a administradores personalizar qué KPIs mostrar.

3. **Exportación:** (Fase futura) Permitir exportar dashboard como PDF o imagen.

---

**Módulo relacionado:** Todos los módulos alimentan datos al Dashboard.














