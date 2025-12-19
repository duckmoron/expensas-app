// expensas-app\services\jsonService.js
const fs = require('fs').promises;
const path = require('path');

const PARSER_DIR = path.join(__dirname, '../json/parserPDF');
const DOCS_FILE = path.join(__dirname, '../json/documentacion_unidades.json');

const jsonService = {
  // Obtener el JSON activo basado en la sesión o el último modificado
  getActiveJSON: async (session) => {
    if (session?.jsonActivo) {
      const jsonPath = path.join(PARSER_DIR, session.jsonActivo);
      try {
        const data = await fs.readFile(jsonPath, 'utf8');
        return {
          name: session.jsonActivo,
          data: JSON.parse(data)
        };
      } catch {
        session.jsonActivo = null;
      }
    }
    return await jsonService.getLastParsedJSON();
  },

  // Obtener el último JSON parseado por fecha
  getLastParsedJSON: async () => {
    try {
      const files = await fs.readdir(PARSER_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      if (!jsonFiles.length) return null;

      const fileStats = await Promise.all(
        jsonFiles.map(async f => ({
          name: f,
          mtime: (await fs.stat(path.join(PARSER_DIR, f))).mtime
        }))
      );

      fileStats.sort((a, b) => b.mtime - a.mtime);
      const lastFile = fileStats[0].name;
      const data = await fs.readFile(path.join(PARSER_DIR, lastFile), 'utf8');
      return { name: lastFile, data: JSON.parse(data) };
    } catch {
      return null;
    }
  },

  // Listar todos los archivos JSON disponibles
  getAllParsedJSONFiles: async () => {
    try {
      const files = await fs.readdir(PARSER_DIR);
      return files.filter(f => f.endsWith('.json'));
    } catch {
      return [];
    }
  },

  // Obtener el contenido de TODOS los JSONs para estadísticas
  getAllJSONData: async () => {
    try {
      const files = await fs.readdir(PARSER_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const allData = await Promise.all(jsonFiles.map(async f => {
        const content = await fs.readFile(path.join(PARSER_DIR, f), 'utf8');
        return JSON.parse(content);
      }));
      
      return allData;
    } catch (error) {
      console.error("Error reading all JSON data:", error);
      return [];
    }
  },

  // Guardar un nuevo JSON parseado
  saveParsedJSON: async (fileName, data) => {
    const jsonPath = path.join(PARSER_DIR, fileName);
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
  },

  // Leer documentación de unidades
  getDocumentation: async () => {
    try {
      const fileContent = await fs.readFile(DOCS_FILE, 'utf8');
      return JSON.parse(fileContent);
    } catch {
      return {};
    }
  },

  // Guardar documentación de unidades
  saveDocumentation: async (data) => {
    await fs.mkdir(path.dirname(DOCS_FILE), { recursive: true });
    await fs.writeFile(DOCS_FILE, JSON.stringify(data, null, 2));
  }
};

module.exports = jsonService;
