const jsonService = require('../services/jsonService');

const estadisticasController = {
  index: async (req, res) => {
    try {
      const rawData = await jsonService.getAllJSONData();

      // Helper para convertir string de moneda "1.234,56" a float 1234.56
      const parseMoney = (str) => {
        if (!str) return 0;
        // Eliminar puntos de mil y cambiar coma decimal por punto
        return parseFloat(str.toString().replace(/\./g, '').replace(',', '.'));
      };

      // Mapear y normalizar datos
      const stats = rawData.map(file => {
        const meta = file.metadata?.dinamicos || {};
        const periodoStr = meta.aviso_pago?.periodo?.trim() || 'Desconocido';
        
        return {
          archivo: file.__filename, // Pasamos el nombre del archivo al frontend
          periodo: periodoStr,
          gastos: {
            total: parseMoney(meta.gastos_mes?.total_gastos),
            rubros: (meta.gastos_mes?.rubros || []).map(r => ({
              // Extraer nombre limpio del rubro (ej: "Total Rubro 1")
              label: r.raw ? r.raw.split('(')[0].trim() : 'Rubro',
              total: parseMoney(r.total)
            }))
          },
          finanzas: {
            saldo_inicial: parseMoney(meta.pagos_cobranzas?.saldo_inicial),
            ingresos: parseMoney(meta.pagos_cobranzas?.ingresos_expensas),
            // Los egresos suelen venir en negativo, los pasamos a positivo para el gráfico
            egresos: Math.abs(parseMoney(meta.pagos_cobranzas?.egresos)),
            saldo_final: parseMoney(meta.pagos_cobranzas?.saldo_final)
          },
          expensas: {
            total: parseMoney(file.totales?.total_general),
            unidades: (file.unidades || []).map(u => ({
              uni: u.uni,
              total: parseMoney(u.total)
            }))
          }
        };
      });

      // Ordenar cronológicamente (Mes Año)
      const meses = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
        'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };

      stats.sort((a, b) => {
        const [mesA, anioA] = a.periodo.split(' ');
        const [mesB, anioB] = b.periodo.split(' ');
        
        if (anioA !== anioB) return (parseInt(anioA) || 0) - (parseInt(anioB) || 0);
        return (meses[mesA] || 0) - (meses[mesB] || 0);
      });

      res.render('estadisticas/index', {
        title: 'Estadísticas',
        statsData: JSON.stringify(stats) // Pasamos los datos al frontend
      });

    } catch (error) {
      console.error(error);
      res.status(500).render('errors/error', { message: 'Error al cargar estadísticas', error });
    }
  }
};

module.exports = estadisticasController;