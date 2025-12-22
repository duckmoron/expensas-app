document.addEventListener('DOMContentLoaded', () => {
  /* =========================================
     BUSCADOR
     ========================================= */
  const input = document.getElementById("searchInput");
  const estadoFilter = document.getElementById("estadoFilter");
  const filterCount = document.getElementById("filterCount");
  const btnClear = document.getElementById("btnClearFilters");
  const filas = document.querySelectorAll(".fila");

  function filterTable() {
    const searchVal = input ? input.value.toLowerCase().trim() : "";
    const estadoVal = estadoFilter ? estadoFilter.value : "";
    let visibleCount = 0;

    filas.forEach(f => {
      const txt = f.dataset.search || "";
      const estado = f.dataset.estado || "";

      const matchesSearch = txt.includes(searchVal);
      const matchesEstado = estadoVal === "" || estado === estadoVal;

      if (matchesSearch && matchesEstado) {
        f.style.display = "";
        visibleCount++;
      } else {
        f.style.display = "none";
      }
    });

    if (filterCount) filterCount.textContent = `(${visibleCount})`;

    if (btnClear) {
      if (searchVal || estadoVal) btnClear.classList.remove('hidden');
      else btnClear.classList.add('hidden');
    }
  }

  if (input) input.addEventListener("input", filterTable);
  if (estadoFilter) estadoFilter.addEventListener("change", filterTable);
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (input) input.value = "";
      if (estadoFilter) estadoFilter.value = "";
      filterTable();
    });
  }
  
  // Inicializar contador al cargar
  filterTable();

  /* =========================================
     ORDENAMIENTO
     ========================================= */
  let sortState = {};
  
  document.querySelectorAll(".sort").forEach(th => {
    th.addEventListener("click", () => {
      const tipo = th.dataset.sort;
      const tbody = document.getElementById("tabla");
      sortState[tipo] = sortState[tipo] === "asc" ? "desc" : "asc";
      const asc = sortState[tipo] === "asc";

      document.querySelectorAll(".sort-icon").forEach(i => {
        i.textContent = "⇅";
        i.classList.remove("text-blue-600", "dark:text-blue-400");
      });

      const icon = th.querySelector(".sort-icon");
      icon.textContent = asc ? "↑" : "↓";
      icon.classList.add("text-blue-600", "dark:text-blue-400");

      const rows = Array.from(tbody.querySelectorAll("tr"));

      rows.sort((a, b) => {
        let va = a.dataset[tipo];
        let vb = b.dataset[tipo];

        if (tipo === "uni" || tipo === "total") return asc ? va - vb : vb - va;
        if (tipo === "copropietario") return asc ? va.localeCompare(vb) : vb.localeCompare(va);
        return 0;
      });

      rows.forEach(r => tbody.appendChild(r));
    });
  });

  /* =========================================
     WIZARD DE CARGA (PDF vs JSON)
     ========================================= */
  const wizardButtons = document.getElementById('wizardButtons');
  const selectJsonDiv = document.getElementById('selectJsonDiv');
  const uploadPdfDiv = document.getElementById('uploadPdfDiv');
  const wizardActions = document.getElementById('wizardActions');

  const btnListado = document.getElementById('btnListado');
  const btnSubirPDF = document.getElementById('btnSubirPDF');
  const btnCancelarWizard = document.getElementById('btnCancelarWizard');

  if (btnListado) {
    btnListado.addEventListener('click', () => {
      wizardButtons.classList.add('hidden');
      selectJsonDiv.classList.remove('hidden');
      wizardActions.classList.remove('hidden');
    });
  }

  if (btnSubirPDF) {
    btnSubirPDF.addEventListener('click', () => {
      wizardButtons.classList.add('hidden');
      uploadPdfDiv.classList.remove('hidden');
      wizardActions.classList.remove('hidden');
    });
  }

  if (btnCancelarWizard) {
    btnCancelarWizard.addEventListener('click', () => {
      // Recargar para limpiar estado es lo más simple, o resetear clases
      window.location.reload();
    });
  }
});