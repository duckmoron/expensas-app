require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const fsSync = require('fs'); // Add this line for sync operations if needed elsewhere
const extractText = require('./utils/extractText');
const { parseEstadoCuentas } = require('./utils/parseEstadoCuentas');
console.log('parseEstadoCuentas type:', typeof parseEstadoCuentas);

const app = express();
let datosExpensas = { unidades: [], totales: {} };
let ultimoArchivo = null; // <-- variable global para mantener el PDF seleccionado

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configuración de fileUpload (debe estar antes de las rutas)
app.use(fileUpload({
  createParentPath: true,  // Crea automáticamente los directorios necesarios
  limits: { 
    fileSize: 5 * 1024 * 1024  // 5MB
  },
  abortOnLimit: true,
  responseOnLimit: "El archivo es demasiado grande (máx. 5MB)"
}));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Multer para imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { ps, dpto } = req.body;
    const dir = path.join(__dirname, 'uploads', `${ps}_${dpto}`);
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG o PNG'), false);
    }
  }
});

// Crear carpetas necesarias al iniciar
const initFolders = async () => {
  const folders = ['public/pdf', 'uploads'];
  for (const folder of folders) {
    try {
      await fs.mkdir(path.join(__dirname, folder), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
};

// Rutas
app.get("/", (req, res) => {
  res.render("index", {
    title: "Expensas",
    headerTitle: "Cargar Estado de Cuentas",
    unidades: datosExpensas.unidades || [],
    totales: datosExpensas.totales || {},
    nombreArchivo: ultimoArchivo // <-- paso el último archivo cargado al template
  });
});

// Procesar PDF
app.post("/procesar-pdf", async (req, res, next) => {
  try {
    if (!req.files?.pdfFile) {
      throw new Error('No se subió ningún archivo');
    }

    const pdfFile = req.files.pdfFile;
    console.log("Procesando archivo:", pdfFile.name);
    
    // Procesar directamente el buffer
    const text = await extractText(pdfFile.data);
    console.log("Texto extraído:", text.length, "caracteres");
    
    const parsedData = parseEstadoCuentas(text);
    datosExpensas = parsedData;

    // Guardar el PDF
    const pdfPath = path.join(__dirname, 'public', 'pdf', 'expensas.pdf');
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });
    await fs.writeFile(pdfPath, pdfFile.data);

    // Guardar nombre del archivo para mantenerlo al volver al índice
    ultimoArchivo = pdfFile.name;

    res.redirect('/');

  } catch (error) {
    console.error("❌ Error al procesar el PDF:", error);
    next(error);
  }
});

// Detalle de unidad
app.get('/detalle/:uni', async (req, res) => {
    const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
    let datosGuardados = {};
    
    try {
        try {
            // Use fs.promises.access to check if file exists
            await fs.access(jsonPath);
            const fileContent = await fs.readFile(jsonPath, 'utf8');
            datosGuardados = JSON.parse(fileContent);
            console.log('Datos cargados del archivo:', datosGuardados);
        } catch (err) {
            console.log('Archivo de documentación no encontrado, se creará uno nuevo');
        }

        const unidad = datosExpensas.unidades.find(u => u.uni === req.params.uni);
        if (!unidad) {
            return res.status(404).send('Unidad no encontrada');
        }

        res.render('detalle', { 
            title: `UNIDAD ${unidad.uni}`,
            u: {
                ...unidad,
                documentacion: datosGuardados[unidad.uni] || {}
            }
        });
    } catch (error) {
        console.error('Error en ruta /detalle/:uni:', error);
        res.status(500).send('Error al cargar los datos');
    }
});

// Guardar documentación
app.post('/guardar-documentacion', async (req, res) => {
    try {
        const { uni, ps, dpto = '' } = req.body;
        
        if (!uni || !ps) {
            return res.status(400).json({ 
                success: false, 
                message: `Faltan datos requeridos` 
            });
        }

        const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
        let data = {};
        
        try {
            const fileContent = await fs.readFile(jsonPath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log('Creando archivo de documentación...');
        }

        // Handle file uploads
        let imagenes = [];
        if (req.files && Object.keys(req.files).length > 0) {
            const uploadDir = path.join(__dirname, 'public', 'uploads', uni);
            await fs.mkdir(uploadDir, { recursive: true });

            const files = Array.isArray(req.files.imagenes) ? 
                req.files.imagenes : 
                [req.files.imagenes].filter(Boolean);

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

        // Update or create the unit's data
        data[uni] = {
            ...data[uni],  // Keep existing data
            ...req.body,   // Update with new form data
            imagenes: [...(data[uni]?.imagenes || []), ...imagenes], // Combine old and new images
            actualizado: new Date().toISOString()
        };

        // Save the updated data
        await fs.mkdir(path.dirname(jsonPath), { recursive: true });
        await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

        res.json({ 
            success: true,
            message: 'Datos guardados correctamente',
            data: data[uni]
        });

    } catch (error) {
        console.error('Error al guardar:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar: ' + error.message 
        });
    }
});

// Ruta para eliminar una imagen
app.post('/eliminar-imagen', async (req, res) => {
  try {
    const { uni, imagePath } = req.body;
    
    if (!uni || !imagePath) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });
    }

    const jsonPath = path.join(__dirname, 'json', 'documentacion_unidades.json');
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Verificar si la unidad existe
    if (!data[uni]) {
      return res.status(404).json({ success: false, message: 'Unidad no encontrada' });
    }

    // Obtener la ruta relativa de la imagen (sin el prefijo /uploads)
    const relativeImagePath = imagePath.startsWith('/uploads/') ? imagePath.substring(1) : imagePath;
    
    // Ruta completa del archivo de imagen
    const fullImagePath = path.join(__dirname, 'public', relativeImagePath);

    // Verificar si el archivo existe
    try {
      await fs.access(fullImagePath);
    } catch (err) {
      console.error('El archivo no existe:', fullImagePath);
      // Continuamos aunque el archivo no exista, para limpiar la referencia
    }

    // Eliminar la referencia de la imagen en el JSON
    if (data[uni].imagenes) {
      data[uni].imagenes = data[uni].imagenes.filter(img => img.path !== imagePath);
      data[uni].actualizado = new Date().toISOString();
    }

    // Guardar los cambios en el JSON
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

    // Intentar eliminar el archivo físico
    try {
      await fs.unlink(fullImagePath);
    } catch (err) {
      console.error('Error al eliminar el archivo físico:', err);
      // No fallamos si no se puede eliminar el archivo físico
    }

    res.json({ success: true, message: 'Imagen eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar la imagen: ' + error.message 
    });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }

  res.status(500).render('error', {
    message: err.message || 'Ocurrió un error inesperado',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
initFolders().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
