module.exports = (req, res, next) => {
  // Verificar si existe usuario en sesión
  const isAuthenticated = req.session && req.session.user;
  res.locals.isAuthenticated = !!isAuthenticated;
  res.locals.user = isAuthenticated ? req.session.user : null;
  next();
};