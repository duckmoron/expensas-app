require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./routes/index');
const globalData = require('./middlewares/globalData');
const sessionConfig = require('./middlewares/sessionConfig');
const uploadConfig = require('./middlewares/uploadConfig');
const { notFound, serverError } = require('./middlewares/errorHandlers');
const initFolders = require('./utils/initFolders');

const app = express();

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Middlewares
app.use(sessionConfig);
app.use(globalData);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(uploadConfig);
app.use(express.static(path.join(__dirname, 'public')));


// RUTAS
app.use('/', routes);

// Manejo de errores
app.use(notFound);   // Primero intentamos matchear ruta, si no, es 404
app.use(serverError); // Si hubo un error en alguna ruta, cae aquí

// Iniciar servidor
const PORT = process.env.PORT || 3000;
initFolders().then(() => {
  app.listen(PORT, () => console.log(`Servidor funcionando en http://localhost:${PORT}`));
}).catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
