// Script para actualizar el color del selector al cambiar
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('estadoInforme');
    if (select) {
      select.addEventListener('change', function() {
        const val = this.value;
        // Limpiar clases de color específicas
        this.classList.remove(
          'border-red-500', 'text-red-700', 'dark:text-red-400', 'focus:border-red-500', 'focus:ring-red-500',
          'border-green-500', 'text-green-700', 'dark:text-green-400', 'focus:border-green-500', 'focus:ring-green-500',
          'border-yellow-500', 'text-yellow-700', 'dark:text-yellow-400', 'focus:border-yellow-500', 'focus:ring-yellow-500',
          'border-orange-500', 'text-orange-700', 'dark:text-orange-400', 'focus:border-orange-500', 'focus:ring-orange-500',
          'border-blue-500', 'text-blue-700', 'dark:text-blue-400', 'focus:border-blue-500', 'focus:ring-blue-500',
          'border-gray-300', 'dark:border-gray-600', 'dark:text-white', 'focus:border-indigo-500', 'focus:ring-indigo-500'
        );

        let newClasses = ['border-gray-300', 'dark:border-gray-600', 'dark:text-white', 'focus:border-indigo-500', 'focus:ring-indigo-500'];
        if (val === 'Trabajos urgentes') newClasses = ['border-red-500', 'text-red-700', 'dark:text-red-400', 'focus:border-red-500', 'focus:ring-red-500'];
        else if (val === 'Trabajos finalizados') newClasses = ['border-green-500', 'text-green-700', 'dark:text-green-400', 'focus:border-green-500', 'focus:ring-green-500'];
        else if (val === 'Trabajos en proceso') newClasses = ['border-yellow-500', 'text-yellow-700', 'dark:text-yellow-400', 'focus:border-yellow-500', 'focus:ring-yellow-500'];
        else if (val === 'Trabajos pendientes') newClasses = ['border-orange-500', 'text-orange-700', 'dark:text-orange-400', 'focus:border-orange-500', 'focus:ring-orange-500'];
        else if (val === 'Informe presentado por Co-propietario') newClasses = ['border-blue-500', 'text-blue-700', 'dark:text-blue-400', 'focus:border-blue-500', 'focus:ring-blue-500'];

        this.classList.add(...newClasses);
      });
    }
  });