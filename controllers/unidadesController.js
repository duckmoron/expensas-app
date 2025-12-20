// expensas-app\controllers\unidadesController.js
const path = require('path');
const fs = require('fs').promises;
const jsonService = require('../services/jsonService');

const unidadesController = {
  detalle: async (req, res) => {
    try {
      // Si viene el parámetro json en la URL, actualizamos la sesión para ver ese histórico
      if (req.query.json) {
        req.session.jsonActivo = req.query.json;
      }

      const lastJSON = await jsonService.getActiveJSON(req.session);
      if (!lastJSON) return res.status(404).send('No hay datos de PDF procesados');

      const unidad = lastJSON.data.unidades.find(u => u.uni === req.params.uni);
      if (!unidad) return res.status(404).send('Unidad no encontrada');

      const datosGuardados = await jsonService.getDocumentation();

      res.render('unidades/detalle', {
        title: `UNIDAD ${unidad.uni}`,
        u: { ...unidad, documentacion: datosGuardados[unidad.uni] || {} }
      });

    } catch (error) {
      console.error(error);
      res.status(500).send('Error al cargar la unidad');
    }
  },

  guardarDocumentacion: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(403).json({ success: false, message: 'Modo Lectura: Debe iniciar sesión para realizar cambios.' });
      }

      const { uni, ps } = req.body;
      if (!uni || !ps) return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });

      let data = await jsonService.getDocumentation();

      // Manejo de imágenes
      let imagenes = [];
      if (req.files && Object.keys(req.files).length > 0) {
        const uploadDir = path.join(__dirname, '../public/uploads', uni);
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

      // Actualizar datos
      data[uni] = {
        ...data[uni],
        ...req.body,
        imagenes: [...(data[uni]?.imagenes || []), ...imagenes],
        actualizado: new Date().toISOString()
      };

      await jsonService.saveDocumentation(data);

      res.json({ success: true, message: 'Datos guardados correctamente', data: data[uni] });

    } catch (error) {
      console.error('Error al guardar:', error);
      res.status(500).json({ success: false, message: 'Error al guardar: ' + error.message });
    }
  },

  eliminarImagen: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(403).json({ success: false, message: 'Modo Lectura: Debe iniciar sesión para eliminar imágenes.' });
      }

      const { uni, imagePath } = req.body;
      if (!uni || !imagePath) return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });

      const data = await jsonService.getDocumentation();

      if (!data[uni]) return res.status(404).json({ success: false, message: 'Unidad no encontrada' });

      const relativeImagePath = imagePath.startsWith('/uploads/') ? imagePath.substring(1) : imagePath;
      const fullImagePath = path.join(__dirname, '../public', relativeImagePath);

      if (data[uni].imagenes) {
        data[uni].imagenes = data[uni].imagenes.filter(img => img.path !== imagePath);
        data[uni].actualizado = new Date().toISOString();
      }

      await jsonService.saveDocumentation(data);

      try { await fs.unlink(fullImagePath); } catch {}

      res.json({ success: true, message: 'Imagen eliminada correctamente' });

    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar la imagen: ' + error.message });
    }
  }
};

module.exports = unidadesController;
