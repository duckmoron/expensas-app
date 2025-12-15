# Expensas App (demo)
Proyecto mínimo para extraer la sección "ESTADO DE CUENTAS Y PRORRATEO" de un PDF de expensas
y mostrar una lista de unidades con detalle.

## Pasos para ejecutar

1. Copiá tu PDF a: `pdf/expensas.pdf` (reemplazá el que está o ponelo si falta).
2. Ejecutá:
   ```bash
   npm install
   npm run dev
   ```
3. Abrí en el navegador: http://localhost:3000

## Notas
- Este proyecto usa `pdfjs-dist` mediante `import()` dinámico para garantizar compatibilidad en Windows
  con instalaciones modernas de `pdfjs-dist` que exponen ES modules.
- El parser `utils/parseEstadoCuentas.js` es simple y puede requerir ajustes para PDFs con formato distinto.
