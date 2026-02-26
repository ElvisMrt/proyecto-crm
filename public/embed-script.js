/**
 * CRM Appointment Form Embed Script
 * Permite incrustar el formulario de citas en cualquier sitio web
 */

(function() {
    'use strict';

    // Configuración por defecto
    const DEFAULT_CONFIG = {
        apiUrl: 'http://localhost:3001/api/public',
        tenantId: 'default',
        theme: 'light',
        language: 'es',
        width: '100%',
        height: 'auto'
    };

    // Estilos CSS para el iframe
    const IFRAME_STYLES = `
        .crm-appointment-iframe {
            border: none;
            width: 100%;
            min-height: 600px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .crm-appointment-container {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
        }
        
        @media (max-width: 640px) {
            .crm-appointment-iframe {
                min-height: 700px;
            }
        }
    `;

    // Función principal
    function CRMAppointmentForm(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.container = null;
        this.iframe = null;
        this.isLoaded = false;
        
        this.init();
    }

    // Inicialización
    CRMAppointmentForm.prototype.init = function() {
        this.createContainer();
        this.createIframe();
        this.loadForm();
    };

    // Crear contenedor
    CRMAppointmentForm.prototype.createContainer = function() {
        this.container = document.createElement('div');
        this.container.className = 'crm-appointment-container';
        this.container.id = 'crm-appointment-' + Date.now();
    };

    // Crear iframe
    CRMAppointmentForm.prototype.createIframe = function() {
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'crm-appointment-iframe';
        this.iframe.style.width = this.config.width;
        this.iframe.style.height = this.config.height;
        this.iframe.style.border = 'none';
        
        // Prevenir que el iframe pueda navegar a otras páginas
        this.iframe.sandbox = 'allow-scripts allow-forms allow-same-origin';
        
        this.container.appendChild(this.iframe);
    };

    // Construir URL del formulario
    CRMAppointmentForm.prototype.buildFormUrl = function() {
        const baseUrl = window.location.origin + '/appointment-form.html';
        const params = new URLSearchParams({
            api_url: this.config.apiUrl,
            tenant: this.config.tenantId,
            theme: this.config.theme,
            lang: this.config.language
        });
        
        return baseUrl + '?' + params.toString();
    };

    // Cargar formulario
    CRMAppointmentForm.prototype.loadForm = function() {
        const formUrl = this.buildFormUrl();
        
        this.iframe.src = formUrl;
        
        // Eventos del iframe
        this.iframe.onload = () => {
            this.isLoaded = true;
            this.onLoad();
        };
        
        this.iframe.onerror = () => {
            this.onError();
        };
    };

    // Evento de carga exitosa
    CRMAppointmentForm.prototype.onLoad = function() {
        if (this.config.onLoad) {
            this.config.onLoad();
        }
        
        // Enviar configuración al iframe
        this.postMessage({
            type: 'CONFIG',
            config: this.config
        });
    };

    // Evento de error
    CRMAppointmentForm.prototype.onError = function() {
        if (this.config.onError) {
            this.config.onError();
        }
    };

    // Enviar mensaje al iframe
    CRMAppointmentForm.prototype.postMessage = function(message) {
        if (this.isLoaded && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(message, '*');
        }
    };

    // Renderizar en el DOM
    CRMAppointmentForm.prototype.render = function(target) {
        let targetElement;
        
        if (typeof target === 'string') {
            targetElement = document.querySelector(target);
        } else if (target instanceof HTMLElement) {
            targetElement = target;
        } else {
            throw new Error('Target must be a selector string or HTMLElement');
        }
        
        if (!targetElement) {
            throw new Error('Target element not found');
        }
        
        targetElement.appendChild(this.container);
        
        if (this.config.onRender) {
            this.config.onRender();
        }
    };

    // Actualizar configuración
    CRMAppointmentForm.prototype.updateConfig = function(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.isLoaded) {
            this.postMessage({
                type: 'UPDATE_CONFIG',
                config: newConfig
            });
        }
    };

    // Resetear formulario
    CRMAppointmentForm.prototype.reset = function() {
        this.postMessage({
            type: 'RESET_FORM'
        });
    };

    // Destruir instancia
    CRMAppointmentForm.prototype.destroy = function() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.iframe = null;
        this.isLoaded = false;
    };

    // Función global para crear instancias
    window.createCRMAppointmentForm = function(config) {
        return new CRMAppointmentForm(config);
    };

    // Función helper para instalación rápida
    window.embedCRMAppointmentForm = function(target, config = {}) {
        const form = new CRMAppointmentForm(config);
        form.render(target);
        return form;
    };

    // Inyectar estilos CSS
    function injectStyles() {
        if (document.getElementById('crm-appointment-styles')) {
            return; // Ya están inyectados
        }
        
        const style = document.createElement('style');
        style.id = 'crm-appointment-styles';
        style.textContent = IFRAME_STYLES;
        document.head.appendChild(style);
    }

    // Auto-inicialización para data attributes
    function autoInit() {
        const elements = document.querySelectorAll('[data-crm-appointment-form]');
        
        elements.forEach(element => {
            const config = {
                apiUrl: element.dataset.apiUrl || DEFAULT_CONFIG.apiUrl,
                tenantId: element.dataset.tenantId || DEFAULT_CONFIG.tenantId,
                theme: element.dataset.theme || DEFAULT_CONFIG.theme,
                language: element.dataset.language || DEFAULT_CONFIG.language
            };
            
            new CRMAppointmentForm(config).render(element);
        });
    }

    // Inicialización cuando el DOM está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            injectStyles();
            autoInit();
        });
    } else {
        injectStyles();
        autoInit();
    }

    // Escuchar mensajes del iframe
    window.addEventListener('message', function(event) {
        if (event.data.type === 'APPOINTMENT_CREATED') {
            // Disparar evento personalizado
            const customEvent = new CustomEvent('crmAppointmentCreated', {
                detail: event.data.appointment
            });
            document.dispatchEvent(customEvent);
        }
    });

})();
