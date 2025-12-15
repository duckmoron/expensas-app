const pdfParse = require("pdf-parse");

async function extractText(buffer) {
    try {
        console.log("➡ Procesando PDF desde buffer...");
        
        if (!buffer || buffer.length === 0) {
            throw new Error('El buffer del PDF está vacío');
        }

        console.log("Extrayendo texto del PDF...");
        const data = await pdfParse(buffer);
        
        if (!data.text) {
            throw new Error('No se pudo extraer texto del PDF');
        }

        console.log("➡ Texto extraído:", data.text.length, "caracteres");
        return data.text;
        
    } catch (error) {
        console.error("❌ Error en extractText:", error.message);
        throw error;
    }
}

module.exports = extractText;