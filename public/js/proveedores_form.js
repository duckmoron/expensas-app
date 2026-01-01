// Funciones globales para ser llamadas desde el HTML (onclick)
window.selectColor = function(colorClass) {
    const rubroColorInput = document.getElementById('rubroColorInput');
    const colorPreview = document.getElementById('colorPreview');
    if(rubroColorInput) rubroColorInput.value = colorClass;
    if(colorPreview) colorPreview.className = `w-10 h-10 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center shadow-sm ${colorClass}`;
}

window.syncRubro = function(val) {
    const rubroInput = document.getElementById('rubroInput');
    if(rubroInput) rubroInput.value = val;
}

window.selectRubro = function(nombre, color) {
    const rubroVisual = document.getElementById('rubroVisual');
    const rubroInput = document.getElementById('rubroInput');
    if(rubroVisual) rubroVisual.value = nombre;
    if(rubroInput) rubroInput.value = nombre;
    selectColor(color || 'bg-gray-100 text-gray-800');
}

window.deleteRubro = async function(nombre, btnElement) {
    if (window.showConfirm) {
        const result = await window.showConfirm({
            title: '¿Eliminar etiqueta?',
            text: `Se eliminará "${nombre}" de la lista de opciones disponibles.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;
    } else if(!confirm(`¿Eliminar la etiqueta "${nombre}" de la lista?`)) return;
    
    try {
        const res = await fetch('/proveedores/eliminar-rubro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        if(res.ok) {
            btnElement.parentElement.remove();
            if (window.showAlert) window.showAlert({ icon: 'success', title: 'Etiqueta eliminada' });
        }
    } catch(e) { 
        console.error(e);
        if (window.showAlert) window.showAlert({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la etiqueta' });
    }
}

// Interceptar el envío del formulario principal (Nuevo / Editar)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    // Verificamos que sea el formulario de carga/edición y no uno de eliminación
    if (form && !form.classList.contains('form-eliminar')) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Evitar doble clic
            if (submitBtn.disabled) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

            try {
                const formData = new FormData(form);
                const data = new URLSearchParams(formData);

                const response = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                if (response.redirected) {
                    // Éxito: El servidor redirigió (generalmente a /proveedores)
                    if (window.showAlert) {
                        await window.showAlert({ icon: 'success', title: 'Guardado correctamente' });
                    }
                    // Esperamos un momento para que se vea el toast antes de cambiar de página
                    setTimeout(() => {
                        window.location.href = response.url;
                    }, 1500);
                } else {
                    // Si no redirige, probablemente hubo un error de validación (el servidor devolvió HTML)
                    const html = await response.text();
                    document.open();
                    document.write(html);
                    document.close();
                }
            } catch (error) {
                console.error(error);
                if (window.showAlert) {
                    window.showAlert({ icon: 'error', title: 'Error', text: 'Ocurrió un error al intentar guardar.' });
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
