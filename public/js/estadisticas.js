document.addEventListener('DOMContentLoaded', () => {
  const data = window.statsData;

  if (!data || data.length === 0) {
    console.warn("No hay datos para estadísticas");
    return;
  }

  const periodos = data.map(d => d.periodo);
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  // Configuración común
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  /* =========================================
     1. GRÁFICO: EVOLUCIÓN GASTO TOTAL
     ========================================= */
  const ctxGastos = document.getElementById('chartGastosTotal');
  if (ctxGastos) {
    new Chart(ctxGastos, {
      type: 'line',
      data: {
        labels: periodos,
        datasets: [{
          label: 'Total Gastos ($)',
          data: data.map(d => d.gastos.total),
          borderColor: '#4f46e5', // Indigo 600
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$ ${ctx.raw.toLocaleString('es-AR')}`
            }
          }
        }
      }
    });
  }

  /* =========================================
     2. GRÁFICO: RUBROS (Promedio o Acumulado)
     ========================================= */
  // Vamos a sumar los totales de cada rubro a través de todos los periodos para ver la incidencia general
  const rubrosMap = {};
  data.forEach(d => {
    d.gastos.rubros.forEach(r => {
      if (!rubrosMap[r.label]) rubrosMap[r.label] = 0;
      rubrosMap[r.label] += r.total;
    });
  });

  const rubrosLabels = Object.keys(rubrosMap);
  const rubrosValues = Object.values(rubrosMap);

  const ctxRubros = document.getElementById('chartRubros');
  if (ctxRubros) {
    new Chart(ctxRubros, {
      type: 'doughnut',
      data: {
        labels: rubrosLabels,
        datasets: [{
          data: rubrosValues,
          backgroundColor: [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  /* =========================================
     3. GRÁFICO: FINANZAS (Ingresos vs Egresos)
     ========================================= */
  const ctxFinanzas = document.getElementById('chartFinanzas');
  if (ctxFinanzas) {
    new Chart(ctxFinanzas, {
      type: 'bar',
      data: {
        labels: periodos,
        datasets: [
          {
            label: 'Ingresos',
            data: data.map(d => d.finanzas.ingresos),
            backgroundColor: '#10b981', // Green
            borderRadius: 4
          },
          {
            label: 'Egresos',
            data: data.map(d => d.finanzas.egresos),
            backgroundColor: '#ef4444', // Red
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
});