// Script para auto-llenar y enviar el formulario
(function() {
    console.log('🚀 Iniciando demo automático del formulario de citas...');
    
    // Esperar a que el DOM esté listo
    setTimeout(() => {
        const form = document.getElementById('appointmentForm');
        if (!form) {
            console.error('❌ Formulario no encontrado');
            return;
        }

        console.log('✅ Formulario encontrado, llenando campos...');

        // Datos de demo
        const demoData = {
            clientName: 'Juan Pérez Demo',
            clientEmail: 'juan.perez@demo.com',
            clientPhone: '809-123-4567',
            duration: '60',
            notes: 'Cita de prueba generada automáticamente en modo demo'
        };

        // Fecha y hora (mañana a las 10 AM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        demoData.appointmentDate = tomorrow.toISOString().slice(0, 16);

        // Llenar campos
        Object.keys(demoData).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = demoData[fieldId];
                console.log(`✅ ${fieldId}: ${demoData[fieldId]}`);
            }
        });

        // Seleccionar sucursal si hay opciones
        const branchField = document.getElementById('branchId');
        if (branchField && branchField.options.length > 1) {
            branchField.selectedIndex = 1;
            console.log(`✅ Sucursal: ${branchField.options[branchField.selectedIndex].text}`);
        }

        console.log('⏳ Esperando 2 segundos antes de enviar...');

        // Enviar formulario después de 2 segundos
        setTimeout(() => {
            console.log('📤 Enviando formulario...');
            form.dispatchEvent(new Event('submit'));
            
            // Verificar resultado después de 3 segundos
            setTimeout(() => {
                const successContainer = document.getElementById('successContainer');
                const errorContainer = document.getElementById('errorContainer');
                
                if (successContainer && successContainer.style.display !== 'none') {
                    console.log('🎉 ¡CITA AGENDADA EXITOSAMENTE!');
                    
                    // Verificar localStorage
                    const appointments = JSON.parse(localStorage.getItem('demo_appointments') || '[]');
                    if (appointments.length > 0) {
                        const lastAppointment = appointments[appointments.length - 1];
                        console.log(`💾 Cita guardada con ID: ${lastAppointment.id}`);
                        console.log(`📊 Total de citas en demo: ${appointments.length}`);
                        console.log('📋 Detalles:', lastAppointment);
                    }
                } else if (errorContainer && errorContainer.style.display !== 'none') {
                    console.log('❌ Error al agendar cita');
                } else {
                    console.log('⏳ Procesando...');
                }
            }, 3000);
        }, 2000);

    }, 1000);
})();
