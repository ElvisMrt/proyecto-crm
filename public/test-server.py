#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = '/Users/user/Documents/proyecto-crm/public'

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        # Suppress log messages
        pass

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Servidor iniciado!")
        print(f"📁 Directorio: {DIRECTORY}")
        print(f"🌐 URL: http://localhost:{PORT}")
        print(f"📄 Formulario: http://localhost:{PORT}/appointment-form.html")
        print(f"📋 Ejemplos: http://localhost:{PORT}/example-usage.html")
        print("🔥 Presiona Ctrl+C para detener")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Servidor detenido")
