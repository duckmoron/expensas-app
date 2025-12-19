// Middleware para manejar error 404 (Página no encontrada)
const notFound = (req, res, next) => {
  res.status(404).render('error', {
    message: 'Página no encontrada (Error 404)',
    error: {} // No mostramos stack trace en 404
  });
};

// Middleware para manejar errores generales (500)
const serverError = (err, req, res, next) => {
  console.error('Error del Servidor:', err.stack);
  
  const status = err.status || 500;

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, message: err.message });
  }

  res.status(status).render('error', {
    message: err.message || 'Ocurrió un error inesperado',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = { notFound, serverError };