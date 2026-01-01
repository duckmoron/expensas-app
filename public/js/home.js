document.addEventListener('DOMContentLoaded', () => {
    // Lógica del Wizard (Carga de archivos)
    const btnListado = document.getElementById('btnListado');
    const btnSubirPDF = document.getElementById('btnSubirPDF');
    const btnCancelarWizard = document.getElementById('btnCancelarWizard');
    const wizardButtons = document.getElementById('wizardButtons');
    const selectJsonDiv = document.getElementById('selectJsonDiv');
    const uploadPdfDiv = document.getElementById('uploadPdfDiv');
    const wizardActions = document.getElementById('wizardActions');
    const jsonSelect = document.getElementById('jsonSelect');
    const pdfInput = document.getElementById('pdfInput');

    if(btnListado) {
        btnListado.addEventListener('click', () => {
            wizardButtons.classList.add('hidden');
            selectJsonDiv.classList.remove('hidden');
            wizardActions.classList.remove('hidden');
        });
    }

    if(btnSubirPDF) {
        btnSubirPDF.addEventListener('click', () => {
            wizardButtons.classList.add('hidden');
            uploadPdfDiv.classList.remove('hidden');
            wizardActions.classList.remove('hidden');
        });
    }

    if(btnCancelarWizard) {
        btnCancelarWizard.addEventListener('click', () => {
            wizardButtons.classList.remove('hidden');
            selectJsonDiv.classList.add('hidden');
            uploadPdfDiv.classList.add('hidden');
            wizardActions.classList.add('hidden');
            if(jsonSelect) jsonSelect.value = "";
            if(pdfInput) pdfInput.value = "";
        });
    }

    // Lógica de la Tabla (Filtros, Ordenamiento y Contador)
    const searchInput = document.getElementById('searchInput');
    const estadoFilter = document.getElementById('estadoFilter');
    const btnClearFilters = document.getElementById('btnClearFilters');
    const filterCount = document.getElementById('filterCount');
    const tbody = document.getElementById('tabla');
    // Usamos querySelectorAll y convertimos a Array para poder ordenar
    let rows = Array.from(document.querySelectorAll('#tabla tr.fila'));
    const headers = document.querySelectorAll('th.sort');
    let currentSort = { column: 'uni', order: 'asc' };

    function filterTable() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const estado = estadoFilter ? estadoFilter.value : '';
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.getAttribute('data-search') || '';
            const rowEstado = row.getAttribute('data-estado') || '';
            
            const matchesSearch = text.includes(term);
            const matchesEstado = estado === '' || rowEstado === estado;

            if (matchesSearch && matchesEstado) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        
        if(filterCount) filterCount.textContent = `Mostrando ${visibleCount} de ${rows.length}`;

        if(btnClearFilters) {
            if (term || estado) {
                btnClearFilters.classList.remove('hidden');
            } else {
                btnClearFilters.classList.add('hidden');
            }
        }
    }

    function sortTable(column) {
        if (currentSort.column === column) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.order = 'asc';
        }

        headers.forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (th.dataset.sort === column) {
                icon.textContent = currentSort.order === 'asc' ? '↑' : '↓';
                icon.classList.remove('opacity-40');
            } else {
                icon.textContent = '⇅';
                icon.classList.add('opacity-40');
            }
        });

        rows.sort((a, b) => {
            const valA = a.dataset[column];
            const valB = b.dataset[column];

            if (column === 'total') {
                return currentSort.order === 'asc' ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA);
            }
            return currentSort.order === 'asc' ? valA.localeCompare(valB, undefined, {numeric: true}) : valB.localeCompare(valA, undefined, {numeric: true});
        });

        rows.forEach(row => tbody.appendChild(row));
    }

    if(searchInput) searchInput.addEventListener('input', filterTable);
    if(estadoFilter) estadoFilter.addEventListener('change', filterTable);
    
    headers.forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    if(btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            if(estadoFilter) estadoFilter.value = '';
            filterTable();
        });
    }

    // Inicializar
    filterTable();
});