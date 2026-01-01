document.addEventListener('DOMContentLoaded', () => {
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (!breadcrumbContainer) return;

    const path = window.location.pathname;
    if (path === '/' || path === '') return; // No mostrar en el Home

    const parts = path.split('/').filter(p => p);
    let html = '<ol class="inline-flex items-center space-x-1 md:space-x-3">';
    
    // Enlace a Inicio (Home)
    html += `
        <li class="inline-flex items-center">
            <a href="/" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white">
                <i class="fas fa-home mr-2"></i>
                Inicio
            </a>
        </li>
    `;

    let currentPath = '';
    parts.forEach((part, index) => {
        currentPath += `/${part}`;
        const isLast = index === parts.length - 1;
        
        // Formatear nombre: Capitalizar y reemplazar guiones por espacios
        let name = decodeURIComponent(part);
        name = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

        html += '<li><div class="flex items-center">';
        html += '<i class="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>';
        
        if (isLast) {
            html += `<span class="text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-1">${name}</span>`;
        } else {
            html += `<a href="${currentPath}" class="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white md:ml-1">${name}</a>`;
        }
        html += '</div></li>';
    });

    html += '</ol>';
    breadcrumbContainer.innerHTML = html;
    breadcrumbContainer.classList.remove('hidden');
});