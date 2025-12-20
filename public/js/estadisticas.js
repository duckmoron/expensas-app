document.addEventListener('DOMContentLoaded', () => {
  const rawData = window.statsData;

  if (!rawData || rawData.length === 0) {
    console.warn("No hay datos para estadísticas");
    return;
  }

  // Referencias DOM
  const selectDesde = document.getElementById('periodoDesde');
  const selectHasta = document.getElementById('periodoHasta');
  const rubrosContainer = document.getElementById('rubrosContainer');
  const btnReset = document.getElementById('btnResetFilters');
  const kpiTotal = document.getElementById('kpiGastoTotal');
  const kpiPromedio = document.getElementById('kpiPromedio');
  const kpiPromedioIngresos = document.getElementById('kpiPromedioIngresos');
  const kpiPromedioEgresos = document.getElementById('kpiPromedioEgresos');
  const selectUnidad = document.getElementById('selectUnidad');

  // Configuración de colores y Chart.js
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  // Variables de estado
  let charts = {}; // Para guardar instancias y destruirlas al actualizar
  let allRubros = new Set();

  // 1. INICIALIZACIÓN DE DATOS Y FILTROS
  // --------------------------------------------------
  
  // Extraer todos los rubros únicos
  rawData.forEach(d => {
    d.gastos.rubros.forEach(r => allRubros.add(r.label));
  });
  const sortedRubros = Array.from(allRubros).sort();

  // Poblar Selects de Fechas
  rawData.forEach((d, index) => {
    const option = new Option(d.periodo, index);
    selectDesde.add(option.cloneNode(true));
    selectHasta.add(option);
  });
  // Seleccionar por defecto: Desde el primero hasta el último
  selectDesde.selectedIndex = 0;
  selectHasta.selectedIndex = rawData.length - 1;

  // Poblar Checkboxes de Rubros
  const renderRubros = () => {
    rubrosContainer.innerHTML = '';
    sortedRubros.forEach(rubro => {
      const wrapper = document.createElement('label');
      wrapper.className = "inline-flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition select-none";
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = rubro;
      checkbox.checked = true; // Todos seleccionados por defecto
      checkbox.className = "form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500";
      
      const span = document.createElement('span');
      span.className = "ml-2 text-xs font-medium text-gray-700 dark:text-gray-300";
      span.textContent = rubro;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(span);
      rubrosContainer.appendChild(wrapper);

      checkbox.addEventListener('change', updateDashboard);
    });
  };
  renderRubros();

  // Poblar Select de Unidades
  const allUnidades = new Set();
  rawData.forEach(d => {
    if (d.expensas && d.expensas.unidades) {
      d.expensas.unidades.forEach(u => allUnidades.add(u.uni));
    }
  });
  const sortedUnidades = Array.from(allUnidades).sort();
  
  if (selectUnidad) {
    sortedUnidades.forEach(uni => {
      const option = new Option(`Unidad ${uni}`, uni);
      selectUnidad.add(option);
    });
    selectUnidad.addEventListener('change', updateDashboard);
  }

  // Event Listeners para Fechas
  selectDesde.addEventListener('change', updateDashboard);
  selectHasta.addEventListener('change', updateDashboard);
  
  btnReset.addEventListener('click', () => {
    selectDesde.selectedIndex = 0;
    selectHasta.selectedIndex = rawData.length - 1;
    document.querySelectorAll('#rubrosContainer input').forEach(cb => cb.checked = true);
    updateDashboard();
  });

  // 2. LÓGICA DE ACTUALIZACIÓN
  // --------------------------------------------------
  function updateDashboard() {
    // Obtener índices de rango
    let idxDesde = parseInt(selectDesde.value);
    let idxHasta = parseInt(selectHasta.value);

    // Validar orden
    if (idxDesde > idxHasta) {
      [idxDesde, idxHasta] = [idxHasta, idxDesde]; // Swap si están invertidos
    }

    // Filtrar datos por fecha
    const filteredData = rawData.slice(idxDesde, idxHasta + 1);

    // Obtener rubros seleccionados
    const selectedRubros = Array.from(document.querySelectorAll('#rubrosContainer input:checked')).map(cb => cb.value);

    // Procesar datos para gráficos
    const labels = filteredData.map(d => d.periodo);
    
    // Calcular totales filtrados por rubro
    const gastosTotales = filteredData.map(d => {
      return d.gastos.rubros
        .filter(r => selectedRubros.includes(r.label))
        .reduce((sum, r) => sum + r.total, 0);
    });

    // Calcular KPIs
    const totalAcumulado = gastosTotales.reduce((a, b) => a + b, 0);
    const promedio = gastosTotales.length ? (totalAcumulado / gastosTotales.length) : 0;

    // Calcular KPIs Finanzas (Ingresos / Egresos)
    const totalIngresos = filteredData.reduce((sum, d) => sum + d.finanzas.ingresos, 0);
    const totalEgresos = filteredData.reduce((sum, d) => sum + d.finanzas.egresos, 0);
    const promedioIngresos = filteredData.length ? (totalIngresos / filteredData.length) : 0;
    const promedioEgresos = filteredData.length ? (totalEgresos / filteredData.length) : 0;

    kpiTotal.textContent = `$ ${totalAcumulado.toLocaleString('es-AR')}`;
    kpiPromedio.textContent = `$ ${promedio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    kpiPromedioIngresos.textContent = `$ ${promedioIngresos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    kpiPromedioEgresos.textContent = `$ ${promedioEgresos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

    // Actualizar Gráficos
    renderChartGastos(labels, gastosTotales);
    renderChartRubros(filteredData, selectedRubros);
    renderChartRubrosEvolution(labels, filteredData, selectedRubros);
    renderChartFinanzas(labels, filteredData); // Finanzas no se filtra por rubro, solo fecha
    
    // Nuevos Gráficos de Expensas
    renderChartExpensasTotal(labels, filteredData);
    if (selectUnidad) {
      renderChartExpensasUnidad(labels, filteredData, selectUnidad.value);
    }
  }

  // 3. RENDERIZADO DE GRÁFICOS
  // --------------------------------------------------
  
  function renderChartGastos(labels, dataValues) {
    const ctx = document.getElementById('chartGastosTotal');
    if (!ctx) return;

    // Calcular Tendencia Lineal (Mínimos Cuadrados)
    const n = dataValues.length;
    let trendData = [];
    
    if (n > 1) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dataValues[i];
        sumXY += i * dataValues[i];
        sumXX += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      trendData = dataValues.map((_, i) => slope * i + intercept);
    }

    if (charts.gastos) charts.gastos.destroy();

    charts.gastos = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Gasto Filtrado ($)',
            data: dataValues,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            order: 2
          },
          {
            label: 'Tendencia',
            data: trendData,
            borderColor: '#ef4444', // Rojo para destacar
            borderWidth: 2,
            borderDash: [5, 5], // Línea punteada
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: $ ${c.raw.toLocaleString('es-AR', {maximumFractionDigits: 0})}` } }
        }
      }
    });
  }

  function renderChartRubrosEvolution(labels, dataSubset, activeRubros) {
    const ctx = document.getElementById('chartRubrosEvolution');
    if (!ctx) return;

    if (charts.rubrosEvolution) charts.rubrosEvolution.destroy();

    // Paleta de colores para diferenciar líneas
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
    ];

    const datasets = activeRubros.map((rubro, index) => {
      const data = dataSubset.map(d => {
        const r = d.gastos.rubros.find(item => item.label === rubro);
        return r ? r.total : 0;
      });

      return {
        label: rubro,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.3,
        fill: false,
        pointRadius: 3
      };
    });

    charts.rubrosEvolution = new Chart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index', // Muestra todos los rubros al pasar el mouse por un mes
            intersect: false,
            callbacks: { label: (c) => `${c.dataset.label}: $ ${c.raw.toLocaleString('es-AR')}` }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  function renderChartRubros(dataSubset, activeRubros) {
    const ctx = document.getElementById('chartRubros');
    if (!ctx) return;

    // Sumarizar rubros seleccionados en el periodo
    const rubrosMap = {};
    dataSubset.forEach(d => {
      d.gastos.rubros.forEach(r => {
        if (activeRubros.includes(r.label)) {
          rubrosMap[r.label] = (rubrosMap[r.label] || 0) + r.total;
        }
      });
    });

    if (charts.rubros) charts.rubros.destroy();

    charts.rubros = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(rubrosMap),
        datasets: [{
          data: Object.values(rubrosMap),
          backgroundColor: [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
      }
    });
  }

  function renderChartFinanzas(labels, dataSubset) {
    const ctx = document.getElementById('chartFinanzas');
    if (!ctx) return;

    if (charts.finanzas) charts.finanzas.destroy();

    charts.finanzas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: dataSubset.map(d => d.finanzas.ingresos),
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Egresos',
            data: dataSubset.map(d => d.finanzas.egresos),
            backgroundColor: '#ef4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderChartExpensasTotal(labels, dataSubset) {
    const ctx = document.getElementById('chartExpensasTotal');
    if (!ctx) return;

    if (charts.expensasTotal) charts.expensasTotal.destroy();

    const dataValues = dataSubset.map(d => d.expensas.total);

    charts.expensasTotal = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Liquidado ($)',
          data: dataValues,
          borderColor: '#0ea5e9', // Sky 500
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `$ ${c.raw.toLocaleString('es-AR')}` } }
        }
      }
    });
  }

  function renderChartExpensasUnidad(labels, dataSubset, uniId) {
    const ctx = document.getElementById('chartExpensasUnidad');
    if (!ctx) return;

    if (charts.expensasUnidad) charts.expensasUnidad.destroy();

    const dataValues = dataSubset.map(d => {
        const u = d.expensas.unidades.find(unit => unit.uni === uniId);
        return u ? u.total : 0;
    });

    charts.expensasUnidad = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `Unidad ${uniId} ($)`,
          data: dataValues,
          backgroundColor: '#8b5cf6', // Violet 500
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `$ ${c.raw.toLocaleString('es-AR')}` } }
        },
        onClick: (e, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const record = dataSubset[index];
            if (record && record.archivo) {
              window.location.href = `/detalle/${uniId}?json=${record.archivo}`;
            }
          }
        },
        onHover: (event, chartElement) => {
          event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
      }
    });
  }

  // Inicializar
  updateDashboard();

  // Observer para cambios de tema (Dark Mode)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark');
        const newTextColor = isDark ? '#e5e7eb' : '#374151';
        const newGridColor = isDark ? '#374151' : '#e5e7eb';

        Chart.defaults.color = newTextColor;
        Chart.defaults.borderColor = newGridColor;

        updateDashboard();
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
});