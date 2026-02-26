# 🔧 Corrección: Evolution Manager en Docker

## ❌ Problema Identificado

Evolution Manager es un servicio **separado** de Evolution API y necesita estar configurado correctamente en Docker.

## ✅ Solución Aplicada

He actualizado `docker-compose.yml` para incluir Evolution Manager como un servicio separado.

### Cambios Realizados:

1. **Evolution API** ahora corre en el puerto **8080** (interno y externo)
2. **Evolution Manager** corre en el puerto **8081** (panel web)
3. Se agregó una **red Docker** (`crm_network`) para comunicación entre servicios
4. Evolution Manager se conecta a Evolution API usando el nombre del servicio Docker

## 🚀 Pasos para Aplicar los Cambios

### 1. Detener los contenedores actuales

```bash
docker-compose down
```

### 2. Reiniciar con la nueva configuración

```bash
docker-compose up -d
```

### 3. Verificar que ambos servicios estén corriendo

```bash
docker-compose ps
```

Deberías ver:
- `crm_evolution` (Evolution API) en puerto 8080
- `crm_evolution_manager` (Evolution Manager) en puerto 8081

### 4. Acceder al Panel Manager

Abre en tu navegador: **http://localhost:8081**

## 📋 Configuración de Servicios

### Evolution API
- **Puerto:** 8080
- **URL Interna:** `http://evolution:8080`
- **URL Externa:** `http://localhost:8080`

### Evolution Manager
- **Puerto:** 8081
- **URL Externa:** `http://localhost:8081`
- **Conecta a:** `http://evolution:8080` (usando nombre del servicio Docker)

## 🔍 Verificar Logs

Si hay problemas, revisa los logs:

```bash
# Logs de Evolution API
docker-compose logs evolution

# Logs de Evolution Manager
docker-compose logs evolution-manager
```

## ⚠️ Nota Importante

- Evolution Manager es el **panel web** para gestionar instancias
- Evolution API es el **backend** que maneja las conexiones de WhatsApp
- Ambos deben estar corriendo para que funcione correctamente

## 🐛 Si el QR sigue sin aparecer

1. Verifica que ambos servicios estén corriendo
2. Revisa los logs de ambos servicios
3. Asegúrate de que Evolution Manager pueda comunicarse con Evolution API
4. Intenta reiniciar ambos servicios: `docker-compose restart evolution evolution-manager`










