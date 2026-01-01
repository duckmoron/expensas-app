document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const showInactiveCheckbox = document.getElementById('showInactive');
    const btnClearFilters = document.getElementById('btnClearFilters');
    const filterCount = document.getElementById('filterCount');
    const tbody = document.getElementById('tablaProveedores');
    const rows = Array.from(document.querySelectorAll('#tablaProveedores tr[data-search]'));
    const headers = document.querySelectorAll('th.sort');
    let currentSort = { column: 'nombre', order: 'asc' };

    function filterTable() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const showInactive = showInactiveCheckbox ? showInactiveCheckbox.checked : false;
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.getAttribute('data-search');
            const isActive = row.getAttribute('data-active') === 'true';
            
            const matchesSearch = text.includes(term);
            const matchesStatus = isActive || showInactive;

            if (matchesSearch && matchesStatus) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        
        if(filterCount) filterCount.textContent = `Mostrando ${visibleCount} de ${rows.length}`;

        if(btnClearFilters) {
            if (term) {
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

            if (column === 'stars') {
                return currentSort.order === 'asc' ? valA - valB : valB - valA;
            }
            return currentSort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

        rows.forEach(row => tbody.appendChild(row));
    }

    if(searchInput) searchInput.addEventListener('input', filterTable);
    if(showInactiveCheckbox) showInactiveCheckbox.addEventListener('change', filterTable);
    
    headers.forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    if(btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            searchInput.value = '';
            filterTable();
        });
    }

    // Inicializar
    filterTable();

    // Manejo de eliminación de proveedores con SweetAlert2 (showConfirm)
    document.querySelectorAll('.form-eliminar').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = form.dataset.nombre || 'este proveedor';
            
            if (window.showConfirm) {
                const result = await window.showConfirm({
                    title: '¿Eliminar proveedor?',
                    text: `Estás a punto de eliminar a "${nombre}". Esta acción no se puede deshacer.`,
                    confirmButtonText: 'Sí, eliminar',
                    confirmButtonColor: '#ef4444'
                });
                if (result.isConfirmed) form.submit();
            } else {
                // Fallback por si falla la carga de main.js
                if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) form.submit();
            }
        });
    });
});
