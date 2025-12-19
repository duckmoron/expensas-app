const fs = require('fs').promises;
const path = require('path');

const initFolders = async () => {
  // __dirname apunta a /utils, así que subimos un nivel (..) para ir a la raíz
  const baseDir = path.join(__dirname, '..');
  const folders = ['json/parserPDF', 'public/uploads', 'public/css', 'public/js'];
  
  for (const folder of folders) {
    try {
      await fs.mkdir(path.join(baseDir, folder), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
};

module.exports = initFolders;