/* =========================================
   CONFIGURACIÓN SWEETALERT2
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
  // Configuración global de Toast
  window.Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  // Función global para mostrar alertas
  window.showAlert = function(options) {
    const isDark = document.documentElement.classList.contains('dark');
    const toastOptions = {
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
      iconColor: isDark ? '#818cf8' : '#4f46e5'
    };

    if (typeof options === 'string') {
      return window.Toast.fire({
        ...toastOptions,
        icon: 'info',
        title: options
      });
    }
    return window.Toast.fire({ ...toastOptions, ...options });
  };

  // Función para confirmaciones
  window.showConfirm = function(options) {
    const isDark = document.documentElement.classList.contains('dark');
    return Swal.fire({
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Sí, continuar',
      cancelButtonText: options.cancelButtonText || 'Cancelar',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      ...options
    });
  };

  /* =========================================
     DARK MODE
     ========================================= */
  const toggle = document.getElementById("toggleDark");
  if (toggle) {
    toggle.onclick = () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    };
  }
});

// Inicialización de tooltips de Bootstrap si existen
document.addEventListener('DOMContentLoaded', function() {
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});