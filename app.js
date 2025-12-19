require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const extractText = require('./utils/extractText');
const { parseEstadoCuentas } = require('./utils/parseEstadoCuentas');

const app = express();

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Middleware
app.use(session({
  secret: 'expensas-secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  responseOnLimit: "El archivo es demasiado grande (máx. 5MB)"
}));
app.use(express.static(path.join(__dirname, 'public')));

// ======================================================
// Middleware para inyectar datos globales en todas las vistas
// ======================================================
app.use(async (req, res, next) => {
  try {
    const lastJSON = await getActiveJSON(req);

    res.locals.unidades = lastJSON?.data.unidades || [];
    res.locals.totales = lastJSON?.data.totales || {};
    res.locals.metadata = lastJSON?.data.metadata || {};
    res.locals.nombreArchivo = lastJSON?.name || null;

    next();
  } catch (err) {
    console.error("Error al setear globals:", err);
    next();
  }
});

// ======================================================
// Inicialización de carpetas
// ======================================================
const initFolders = async () => {
  const folders = ['json/parserPDF', 'public/uploads'];
  for (const folder of folders) {
    try {
      await fs.mkdir(path.join(__dirname, folder), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
};

// ======================================================
// Funciones auxiliares
// ======================================================
const getActiveJSON = async (req) => {
  const dir = path.join(__dirname, 'json/parserPDF');

  if (req.session?.jsonActivo) {
    const jsonPath = path.join(dir, req.session.jsonActivo);
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      return {
        name: req.session.jsonActivo,
        data: JSON.parse(data)
      };
    } catch {
      req.session.jsonActivo = null;
    }
  }

  return await getLastParsedJSON();
};

const getLastParsedJSON = async () => {
  const dir = path.join(__dirname, 'json/parserPDF');
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (!jsonFiles.length) return null;

    const fileStats = await Promise.all(
      jsonFiles.map(async f => ({
        name: f,
        mtime: (await fs.stat(path.join(dir, f))).mtime
      }))
    );

    fileStats.sort((a, b) => b.mtime - a.mtime);
    const lastFile = fileStats[0].name;
    const data = await fs.readFile(path.join(dir, lastFile), 'utf8');
    return { name: lastFile, data: JSON.parse(data) };
  } catch {
    return null;
  }
};

const getAllParsedJSONFiles = async () => {
  const dir = path.join(__dirname, 'json/parserPDF');
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
};

// ======================================================
// RUTAS
// ======================================================

// Página principal
app.get("/", async (req, res) => {
  const jsonFiles = await getAllParsedJSONFiles();
  res.render("index", {
    title: "Expensas",
    headerTitle: "Cargar Estado de Cuentas",
    jsonFiles
  });
});

// Procesar PDF o cargar JSON existente
app.post("/procesar-pdf", async (req, res, next) => {
  try {
    const { jsonSeleccionado } = req.body;

    // 🟢 USAR JSON EXISTENTE
    if (jsonSeleccionado) {
      req.session.jsonActivo = jsonSeleccionado;
      return res.redirect("/");
    }

    // 🔵 PROCESAR PDF NUEVO
    if (!req.files?.pdfFile) {
      throw new Error('No se seleccionó PDF ni JSON');
    }

    const pdfFile = req.files.pdfFile;
    const text = await extractText(pdfFile.data);
    const parsedData = parseEstadoCuentas(text);

    const baseName = path.parse(pdfFile.name).name;
    const jsonPath = path.join(__dirname, 'json/parserPDF', `${baseName}.json`);

    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(parsedData, null, 2));

    req.session.jsonActivo = `${baseName}.json`;

    return res.redirect("/");

  } catch (error) {
    console.error("❌ Error al procesar:", error);
    next(error);
  }
});


// Detalle de unidad
app.get('/detalle/:uni', async (req, res) => {
  try {
    const lastJSON = await getActiveJSON(req);
    if (!lastJSON) return res.status(404).send('No hay datos de PDF procesados');

    const unidad = lastJSON.data.unidades.find(u => u.uni === req.params.uni);
    if (!unidad) return res.status(404).send('Unidad no encontrada');

    const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
    let datosGuardados = {};
    try {
      const fileContent = await fs.readFile(jsonPath, 'utf8');
      datosGuardados = JSON.parse(fileContent);
    } catch {}

    res.render('detalle', {
      title: `UNIDAD ${unidad.uni}`,
      u: { ...unidad, documentacion: datosGuardados[unidad.uni] || {} }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar la unidad');
  }
});

// Guardar documentación
app.post('/guardar-documentacion', async (req, res) => {
  try {
    const { uni, ps, dpto = '' } = req.body;
    if (!uni || !ps) return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });

    const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
    let data = {};

    try {
      const fileContent = await fs.readFile(jsonPath, 'utf8');
      data = JSON.parse(fileContent);
    } catch {}

    // Manejo de imágenes
    let imagenes = [];
    if (req.files && Object.keys(req.files).length > 0) {
      const uploadDir = path.join(__dirname, 'public', 'uploads', uni);
      await fs.mkdir(uploadDir, { recursive: true });

      const files = Array.isArray(req.files.imagenes)
        ? req.files.imagenes
        : [req.files.imagenes].filter(Boolean);

      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await file.mv(filePath);

        imagenes.push({
          name: file.name,
          path: `/uploads/${uni}/${fileName}`,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }

    // Guardar la unidad
    data[uni] = {
      ...data[uni],
      ...req.body,
      imagenes: [...(data[uni]?.imagenes || []), ...imagenes],
      actualizado: new Date().toISOString()
    };

    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    res.json({ success: true, message: 'Datos guardados correctamente', data: data[uni] });

  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).json({ success: false, message: 'Error al guardar: ' + error.message });
  }
});

// Eliminar imagen
app.post('/eliminar-imagen', async (req, res) => {
  try {
    const { uni, imagePath } = req.body;
    if (!uni || !imagePath) return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });

    const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data[uni]) return res.status(404).json({ success: false, message: 'Unidad no encontrada' });

    const relativeImagePath = imagePath.startsWith('/uploads/') ? imagePath.substring(1) : imagePath;
    const fullImagePath = path.join(__dirname, 'public', relativeImagePath);

    if (data[uni].imagenes) {
      data[uni].imagenes = data[uni].imagenes.filter(img => img.path !== imagePath);
      data[uni].actualizado = new Date().toISOString();
    }

    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    try { await fs.unlink(fullImagePath); } catch {}

    res.json({ success: true, message: 'Imagen eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la imagen: ' + error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(500).json({ success: false, message: err.message });
  }

  res.status(500).render('error', {
    message: err.message || 'Ocurrió un error inesperado',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
initFolders().then(() => {
  app.listen(PORT, () => console.log(`Servidor funcionando en http://localhost:${PORT}`));
}).catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
