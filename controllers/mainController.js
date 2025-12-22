// expensas-app\controllers\mainController.js
const path = require('path');
const extractText = require('../utils/extractText');
const { parseEstadoCuentas } = require('../utils/parseEstadoCuentas');
const jsonService = require('../services/jsonService');

const mainController = {
  index: async (req, res) => {
    try {
      const jsonFiles = await jsonService.getAllParsedJSONFiles();
      const lastJSON = await jsonService.getActiveJSON(req.session);

      let unidades = [];
      let totales = {};
      let metadata = {};
      let nombreArchivo = req.session.jsonActivo || null;

      // Intentar recuperar el nombre del archivo si no está en sesión y el objeto lo tiene
      if (!nombreArchivo && lastJSON && lastJSON.__filename) {
        nombreArchivo = lastJSON.__filename;
      }

      // Adaptarse a la estructura del JSON (puede tener propiedad .data o ser plana)
      const dataRoot = (lastJSON && lastJSON.data) ? lastJSON.data : lastJSON;

      if (dataRoot && dataRoot.unidades) {
        const documentacion = await jsonService.getDocumentation();
        unidades = (dataRoot.unidades || []).map(u => ({
          ...u,
          documentacion: documentacion[u.uni] || {}
        }));
        totales = dataRoot.totales || {};
        // Buscar metadata en la raíz (lastJSON) o dentro de los datos (dataRoot)
        metadata = lastJSON.metadata || dataRoot.metadata || {};
      }

      res.render("home/index", {
        title: "Expensas",
        headerTitle: "Cargar Estado de Cuentas",
        jsonFiles,
        unidades,
        totales,
        metadata,
        nombreArchivo,
        isAuthenticated: req.session && req.session.user
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar la página principal");
    }
  },

  procesarPdf: async (req, res, next) => {
    try {
      const { jsonSeleccionado } = req.body;

      // 🟢 USAR JSON EXISTENTE
      if (jsonSeleccionado) {
        req.session.jsonActivo = jsonSeleccionado;
        return res.redirect("/");
      }

      // 🔵 PROCESAR PDF NUEVO
      // Verificar autenticación para subir archivos
      if (!req.session.user) {
        return res.status(403).render('errors/error', { message: 'Modo Lectura: Debe iniciar sesión para subir nuevos archivos.' });
      }

      if (!req.files?.pdfFile) {
        throw new Error('No se seleccionó PDF ni JSON');
      }

      const pdfFile = req.files.pdfFile;
      const text = await extractText(pdfFile.data);
      const parsedData = parseEstadoCuentas(text);

      const baseName = path.parse(pdfFile.name).name;
      const fileName = `${baseName}.json`;

      await jsonService.saveParsedJSON(fileName, parsedData);

      req.session.jsonActivo = fileName;
      return res.redirect("/");

    } catch (error) {
      console.error("❌ Error al procesar:", error);
      next(error);
    }
  },

  datosImportantes: (req, res) => {
    res.render("info/datos_importantes", {
      title: "Datos Importantes"
    });
  }
};

module.exports = mainController;
