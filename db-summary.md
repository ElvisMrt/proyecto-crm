# Resumen de Base de Datos - CRM

## Estado del Proyecto
- ✅ Contenedores Docker corriendo
- ✅ Backend activo en puerto 3000
- ✅ Frontend activo en puerto 5173
- ✅ Base de datos PostgreSQL en puerto 5432

## Credenciales de Conexión

**Para DBeaver u otro cliente SQL:**
- Host: localhost
- Puerto: 5432
- Base de datos: crm_master
- Usuario: postgres
- Contraseña: postgres

**Para Prisma Studio:**
- URL: http://localhost:5555
- (Ejecutar: docker-compose exec backend npx prisma studio --port 5555)

## Datos Creados (según seed)

- **10 Clientes** (sin duplicados)
- **8 Productos**
- **5 Facturas** (fiscales y no fiscales)
- **4 Cotizaciones** (abiertas, rechazadas, convertidas)
- **2 Notas de crédito**
- **3 Pagos**
- **5 Movimientos de caja**
- **5 Tareas CRM**

## Comandos Útiles

### Ver datos desde terminal:
```bash
docker-compose exec postgres psql -U postgres -d crm_master
```

### Ejecutar seed nuevamente:
```bash
docker-compose exec backend npx ts-node prisma/seed.ts
```

### Ver logs del backend:
```bash
docker-compose logs backend --tail 50
```

### Reiniciar servicios:
```bash
docker-compose restart
```

## Nota sobre DBeaver

Si no puedes conectar desde DBeaver, verifica:
1. Que el puerto 5432 no esté bloqueado por firewall
2. Que Docker Desktop esté corriendo
3. Que el contenedor `crm_postgres` esté en estado "healthy"
4. Intentar con `127.0.0.1` en lugar de `localhost`












