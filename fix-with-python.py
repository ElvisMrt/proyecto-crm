#!/usr/bin/env python3
"""Script para ejecutar comandos Docker con timeout"""

import subprocess
import sys
import time
import os

def run_command(cmd, cwd=None, timeout=180):
    """Ejecutar comando con timeout"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            'stdout': result.stdout,
            'stderr': result.stderr,
            'code': result.returncode,
            'success': result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {'error': f'Timeout after {timeout}s', 'code': -1, 'success': False}
    except Exception as e:
        return {'error': str(e), 'code': -1, 'success': False}

def main():
    print("=" * 60)
    print("ARREGLANDO TODO CON PYTHON")
    print("=" * 60)
    
    base_dir = "/Users/user/Documents/proyecto-crm"
    backend_dir = os.path.join(base_dir, "backend")
    
    # 1. Docker down
    print("\n[1/7] Deteniendo contenedores...")
    result = run_command("docker-compose down", cwd=base_dir, timeout=60)
    if result['success']:
        print("✅ Contenedores detenidos")
    else:
        print(f"⚠️ {result.get('error', 'Error')}")
    
    # 2. Instalar dependencias
    print("\n[2/7] Instalando dependencias...")
    result = run_command("npm install jsonwebtoken nodemailer @types/nodemailer", cwd=backend_dir, timeout=120)
    if result['success']:
        print("✅ Dependencias instaladas")
    else:
        print(f"❌ Error: {result['stderr'][:200]}")
    
    # 3. Prisma migrate
    print("\n[3/7] Migrando base de datos...")
    result = run_command("npx prisma db push --accept-data-loss", cwd=backend_dir, timeout=120)
    if result['success']:
        print("✅ Base de datos migrada")
    else:
        print(f"❌ Error: {result['stderr'][:200]}")
    
    # 4. Prisma generate
    print("\n[4/7] Generando Prisma Client...")
    result = run_command("npx prisma generate", cwd=backend_dir, timeout=120)
    if result['success']:
        print("✅ Prisma Client generado")
    else:
        print(f"❌ Error: {result['stderr'][:200]}")
    
    # 5. Docker build
    print("\n[5/7] Reconstruyendo backend...")
    result = run_command("docker-compose build backend", cwd=base_dir, timeout=180)
    if result['success']:
        print("✅ Backend reconstruido")
    else:
        print(f"❌ Error: {result['stderr'][:300]}")
    
    # 6. Docker up
    print("\n[6/7] Iniciando servicios...")
    result = run_command("docker-compose up -d", cwd=base_dir, timeout=60)
    if result['success']:
        print("✅ Servicios iniciados")
    else:
        print(f"❌ Error: {result['stderr'][:300]}")
    
    # 7. Verificar
    print("\n[7/7] Verificando...")
    time.sleep(5)
    result = run_command("curl -s http://localhost:3000/health", timeout=10)
    if result['success'] and 'ok' in result['stdout'].lower():
        print("✅ Backend funcionando!")
    else:
        print(f"❌ Backend no responde")
        result2 = run_command("docker logs crm_backend --tail 30", timeout=10)
        print(f"Logs: {result2['stdout'][:500]}")
    
    print("\n" + "=" * 60)
    print("PROCESO COMPLETADO")
    print("=" * 60)
    print("URLs:")
    print("- Frontend: http://localhost:5173")
    print("- Backend: http://localhost:3000")
    print("- Citas públicas: http://localhost:5173/crm/public-appointments")

if __name__ == "__main__":
    main()
