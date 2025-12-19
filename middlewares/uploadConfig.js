const fileUpload = require('express-fileupload');

module.exports = fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  responseOnLimit: "El archivo es demasiado grande (máx. 5MB)"
});