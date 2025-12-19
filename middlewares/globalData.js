const jsonService = require('../services/jsonService');

const globalData = async (req, res, next) => {
  try {
    // Obtiene el JSON activo para que las vistas siempre tengan datos
    const lastJSON = await jsonService.getActiveJSON(req.session);

    res.locals.unidades = lastJSON?.data.unidades || [];
    res.locals.totales = lastJSON?.data.totales || {};
    res.locals.metadata = lastJSON?.data.metadata || {};
    res.locals.nombreArchivo = lastJSON?.name || null;

    next();
  } catch (err) {
    console.error("Error al setear globals:", err);
    next();
  }
};

module.exports = globalData;