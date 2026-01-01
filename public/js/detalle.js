/* =========================================
   ELIMINAR IMAGEN
   ========================================= */
window.eliminarImagen = async function(button, uni, imagePath) {
  if (!window.showConfirm) return alert("Error: Librería de alertas no cargada");

  const result = await window.showConfirm({
    title: '¿Eliminar imagen?',
    text: 'Esta acción no se puede deshacer.',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch('/eliminar-imagen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uni, imagePath })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message);

    button.closest('.relative').remove();
    window.showAlert?.({ icon: 'success', title: 'Imagen eliminada' });

  } catch (err) {
    console.error(err);
    window.showAlert?.({ icon: 'error', title: 'Error', text: err.message });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  /* =========================================
     MANEJO DE IMÁGENES (PREVIEW Y MODAL)
     ========================================= */
  const imagenesInput = document.getElementById('imagenes');
  const imagePreview = document.getElementById('imagePreview');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const closeModal = document.getElementById('closeModal');

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

  function showImageModal(src) {
    if (!modal || !modalImg) return;
    modal.classList.remove('hidden');
    modalImg.src = src;
    document.body.style.overflow = 'hidden';
  }

  if (closeModal) {
    closeModal.onclick = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal.click();
    };
  }

  // Click en imágenes existentes
  document.addEventListener('click', (e) => {
    const img = e.target.closest('#imagenesExistentes img');
    if (img) showImageModal(img.dataset.src);
  });

  // Subir nuevas imágenes
  if (imagenesInput) {
    imagenesInput.addEventListener('change', () => {
      imagePreview.innerHTML = "";

      [...imagenesInput.files].forEach(file => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          window.showAlert?.({ icon: 'error', title: 'Archivo no válido', text: file.name });
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          window.showAlert?.({ icon: 'error', title: 'Archivo demasiado grande', text: file.name });
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const div = document.createElement('div');
          div.className = "relative group";
          div.innerHTML = `
            <img src="${ev.target.result}" class="h-32 w-full object-cover rounded-lg cursor-pointer">
            <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100">✕</button>
          `;
          
          div.querySelector("img").onclick = () => showImageModal(ev.target.result);
          div.querySelector("button").onclick = (e) => {
            e.stopPropagation();
            const dt = new DataTransfer();
            [...imagenesInput.files].forEach(f => { if (f !== file) dt.items.add(f); });
            imagenesInput.files = dt.files;
            div.remove();
          };
          imagePreview.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /* =========================================
     GUARDAR FORMULARIO
     ========================================= */
  const form = document.getElementById("unidadForm");
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";

      try {
        const formData = new FormData(form);
        const res = await fetch('/guardar-documentacion', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        window.showAlert?.({ icon: 'success', title: 'Guardado', text: 'Los datos fueron actualizados' });
        setTimeout(() => location.reload(), 1500);

      } catch (err) {
        console.error(err);
        window.showAlert?.({ icon: 'error', title: 'Error', text: err.message });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar Cambios";
      }
    });
  }

  /* =========================================
     CANCELAR
     ========================================= */
  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) {
    btnCancelar.onclick = () => {
      if (!window.showConfirm) return location.reload();
      window.showConfirm({
        title: "Descartar cambios",
        text: "Se perderán los datos no guardados",
        confirmButtonText: "Descartar",
        cancelButtonText: "Cancelar"
      }).then(r => {
        if (r.isConfirmed) location.reload();
      });
    };
  }

  /* =========================================
     GENERAR PDF
     ========================================= */
  const btnPdf = document.getElementById('descargarPdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', async function () {
      try {
        // Usamos los datos inyectados desde la vista
        const unit = window.unitData; 
        if (!unit) throw new Error("No hay datos de unidad cargados");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - margin * 2;
        let currentY = 20;

        // TÍTULO
        doc.setFontSize(18);
        doc.text('INFORME DE UNIDAD', pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        // DATOS
        doc.setFontSize(12);
        doc.text(`Propietario: ${unit.copropietario || 'No especificado'}`, margin, currentY);
        currentY += 10;
        doc.text(`Piso: ${unit.ps || ''} - Dpto: ${unit.dpto || ''}`, margin, currentY);
        currentY += 10;

        if (unit.documentacion?.actualizado) {
          const fecha = new Date(unit.documentacion.actualizado).toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          doc.text(`Última actualización: ${fecha}`, margin, currentY);
          currentY += 15;
        }

        // DATOS PERSONALES
        doc.setFontSize(14);
        doc.text('DATOS PERSONALES', margin, currentY);
        currentY += 10;
        doc.setFontSize(11);
        currentY = addTextWithLineBreaks(doc, `Email: ${unit.documentacion?.email || 'No especificado'}`, margin, currentY, maxWidth) + 5;
        currentY = addTextWithLineBreaks(doc, `Teléfono: ${unit.documentacion?.telefono || 'No especificado'}`, margin, currentY, maxWidth) + 15;

        // ESTADO
        doc.setFontSize(14);
        doc.text('ESTADO DE LA UNIDAD', margin, currentY);
        currentY += 10;
        doc.setFontSize(11);
        
        doc.text(`Estado del Informe: ${unit.documentacion?.estadoInforme || 'Informe sin presentar por el Co-propietario'}`, margin, currentY);
        currentY += 10;

        currentY = addTextWithLineBreaks(doc, unit.documentacion?.estadoActual || 'No especificado', margin, currentY, maxWidth) + 15;

        // TABLA
        const trabajos = [
          ['Trabajos a Realizar', unit.documentacion?.trabajosNecesarios || 'Ninguno'],
          ['Trabajos en Curso', unit.documentacion?.trabajosEnProceso || 'Ninguno'],
          ['Trabajos Finalizados', unit.documentacion?.trabajosCompletados || 'Ninguno']
        ];
        doc.autoTable({
          startY: currentY,
          head: [['Tipo de Trabajo', 'Descripción']],
          body: trabajos,
          margin: { left: margin },
          theme: 'grid',
          headStyles: { fillColor: [220, 53, 69] }
        });
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

        // OBSERVACIONES
        doc.setFontSize(14);
        doc.text('OBSERVACIONES', margin, currentY);
        currentY += 10;
        doc.setFontSize(11);
        currentY = addTextWithLineBreaks(doc, unit.documentacion?.observaciones || 'Sin observaciones registradas', margin, currentY, maxWidth) + 20;

        // IMÁGENES
        if (unit.documentacion?.imagenes?.length) {
          if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; } else { currentY += 15; }
          doc.setFontSize(14);
          doc.text('IMÁGENES', margin, currentY);
          currentY += 10;

          const imgWidth = (pageWidth - margin * 3) / 2;
          let x = margin;
          let firstInRow = true;

          for (const img of unit.documentacion.imagenes) {
            try {
              const response = await fetch(img.path);
              const blob = await response.blob();
              const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
              
              // Calculamos ratio simple asumiendo carga exitosa
              const imgHeight = imgWidth * 0.75; // Aproximación si no cargamos Image object
              if (currentY + imgHeight > pageHeight - 20) { doc.addPage(); currentY = 20; x = margin; firstInRow = true; }
              
              doc.addImage(base64, x, currentY, imgWidth, imgHeight);
              if (firstInRow) { x = margin * 2 + imgWidth; firstInRow = false; }
              else { x = margin; currentY += imgHeight + 10; firstInRow = true; }
            } catch (e) { console.error(e); }
          }
        }

        doc.save(`Informe_Unidad_${unit.ps || ''}_${unit.dpto || ''}.pdf`);
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        if (window.showAlert) window.showAlert({ icon: 'error', title: 'Error al generar PDF', text: error.message });
        else alert('Ocurrió un error al generar el PDF: ' + error.message);
      }
    });
  }

  function addTextWithLineBreaks(doc, text, x, y, maxWidth) {
    const splitText = doc.splitTextToSize(text, maxWidth);
    doc.text(splitText, x, y);
    return y + (splitText.length * 7);
  }
});