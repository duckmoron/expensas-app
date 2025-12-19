// expensas-app\controllers\mainController.js
const path = require('path');
const extractText = require('../utils/extractText');
const { parseEstadoCuentas } = require('../utils/parseEstadoCuentas');
const jsonService = require('../services/jsonService');

const mainController = {
  index: async (req, res) => {
    const jsonFiles = await jsonService.getAllParsedJSONFiles();
    res.render("home/index", {
      title: "Expensas",
      headerTitle: "Cargar Estado de Cuentas",
      jsonFiles
    });
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
