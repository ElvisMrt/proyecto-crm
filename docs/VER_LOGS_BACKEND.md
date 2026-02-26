# 📋 Cómo Ver los Logs del Backend

## Opción 1: Si usas Docker Compose (Recomendado)

### Ver logs en tiempo real (seguimiento continuo):
```bash
docker-compose logs -f backend
```

### Ver solo las últimas 100 líneas:
```bash
docker-compose logs --tail=100 backend
```

### Ver logs de todos los servicios:
```bash
docker-compose logs -f
```

### Ver logs desde una fecha específica:
```bash
docker-compose logs --since 10m backend
```

### Filtrar logs por texto (ej: buscar "WhatsApp"):
```bash
docker-compose logs backend | Select-String "WhatsApp"
```

## Opción 2: Si ejecutas el backend directamente (npm/node)

Los logs aparecen directamente en la terminal donde ejecutaste:
```bash
npm run dev
# o
npm start
```

## Opción 3: Ver logs del contenedor directamente

### Listar contenedores:
```bash
docker ps
```

### Ver logs de un contenedor específico:
```bash
docker logs -f crm_backend
```

### Ver últimas 100 líneas:
```bash
docker logs --tail=100 crm_backend
```

## 🔍 Buscar Errores Específicos

### Buscar errores de WhatsApp:
```bash
docker-compose logs backend | Select-String "WhatsApp"
```

### Buscar errores de validación:
```bash
docker-compose logs backend | Select-String "VALIDATION_ERROR"
```

### Buscar todos los errores:
```bash
docker-compose logs backend | Select-String "error" -CaseSensitive:$false
```

## 📝 Logs Importantes a Revisar

Cuando envíes un mensaje de WhatsApp, busca estos logs:

1. **Request recibido:**
   ```
   === WhatsApp Send Message Request ===
   ```

2. **Datos recibidos:**
   ```
   Request body: {...}
   Phone value: ...
   TemplateType value: ...
   Variables value: ...
   ```

3. **Errores de validación:**
   ```
   ❌ Validation error details: {...}
   ```

4. **Éxito:**
   ```
   ✅ Validation successful
   ```

## 💡 Tips

- Usa `Ctrl+C` para salir del modo seguimiento (`-f`)
- Los logs se muestran en orden cronológico
- Los logs más recientes aparecen al final








