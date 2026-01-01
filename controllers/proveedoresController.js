const path = require('path');
const fs = require('fs').promises;

const proveedoresPath = path.join(__dirname, '../json/proveedores.json');
const rubrosPath = path.join(__dirname, '../json/rubros.json');

// Helper para obtener rubros
async function getRubros() {
  try {
    const content = await fs.readFile(rubrosPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Si no existe, retornamos una lista vacía o por defecto
    return [];
  }
}

const proveedoresController = {
  index: async (req, res) => {
    let proveedores = [];
    let rubrosMap = {};

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      const todos = JSON.parse(content);
      
      const rubros = await getRubros();
      rubros.forEach(r => { if(r.nombre) rubrosMap[r.nombre.toLowerCase()] = r.color; });

      proveedores = todos; // Enviamos todos para filtrar en la vista
    } catch (error) {
      console.error("Nota: No se pudo leer proveedores.json o no existe.", error.message);
    }

    res.render("proveedores/index", {
      title: "Proveedores",
      proveedores,
      rubrosMap
    });
  },

  nuevo: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const rubros = await getRubros();
    res.render("proveedores/nuevo", {
      title: "Nuevo Proveedor",
      error: null,
      formData: {},
      rubros
    });
  },

  guardar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const { nombre, rubro, rubroColor, cuit, direccion, telefono, email, contacto, observaciones, estrellas } = req.body;

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      let proveedores = JSON.parse(content);

      // Validar si el CUIT ya existe
      if (cuit && proveedores.some(p => p.cuit === cuit)) {
        return res.render("proveedores/nuevo", {
          title: "Nuevo Proveedor",
          error: "El CUIT ingresado ya existe en la base de datos.",
          formData: req.body,
          rubros: await getRubros()
        });
      }

      // Usamos el CUIT como ID si existe, sino generamos uno temporal
      const id = cuit ? cuit : Date.now().toString();

      const nuevoProveedor = {
        id,
        nombre, rubro, rubroColor, cuit, direccion, telefono, email, contacto, observaciones, estrellas: parseInt(estrellas) || 0,
        activo: true
      };

      proveedores.push(nuevoProveedor);
      await fs.writeFile(proveedoresPath, JSON.stringify(proveedores, null, 2));

      // Guardar el rubro en el catálogo global si es nuevo o actualizar color
      if (rubro) {
        let rubros = await getRubros();
        const indexRubro = rubros.findIndex(r => r.nombre.toLowerCase() === rubro.toLowerCase());
        if (indexRubro === -1) {
          rubros.push({ nombre: rubro, color: rubroColor || 'bg-gray-100 text-gray-800' });
        } else {
          // Opcional: Actualizar el color si ya existe
          rubros[indexRubro].color = rubroColor;
        }
        await fs.writeFile(rubrosPath, JSON.stringify(rubros, null, 2));
      }
    } catch (error) {
      console.error("Error guardando proveedor:", error);
    }
    res.redirect('/proveedores');
  },

  editar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    let proveedores = [];
    let rubros = [];
    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      proveedores = JSON.parse(content);
      rubros = await getRubros();
    } catch (error) {
      console.error(error);
    }

    const proveedor = proveedores.find(p => p.id === req.params.id);

    if (!proveedor) {
      return res.redirect('/proveedores');
    }

    res.render("proveedores/editar", {
      title: "Editar Proveedor",
      proveedor,
      rubros
    });
  },

  actualizar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const { id } = req.params;
    const { nombre, rubro, rubroColor, cuit, direccion, telefono, email, contacto, observaciones, estrellas } = req.body;

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      let proveedores = JSON.parse(content);

      // Validar si el CUIT ya existe en otro proveedor diferente
      if (cuit && proveedores.some(p => p.cuit === cuit && p.id !== id)) {
        return res.render("proveedores/editar", {
          title: "Editar Proveedor",
          proveedor: { id, ...req.body }, // Mantenemos los datos ingresados
          error: "El CUIT ingresado ya pertenece a otro proveedor.",
          rubros: await getRubros()
        });
      }

      const index = proveedores.findIndex(p => p.id === id);
      if (index !== -1) {
        proveedores[index] = {
          ...proveedores[index],
          nombre, rubro, rubroColor, cuit, direccion, telefono, email, contacto, observaciones, estrellas: parseInt(estrellas) || 0
        };
        await fs.writeFile(proveedoresPath, JSON.stringify(proveedores, null, 2));

        // Guardar/Actualizar rubro en catálogo global
        if (rubro) {
          let rubros = await getRubros();
          const indexRubro = rubros.findIndex(r => r.nombre.toLowerCase() === rubro.toLowerCase());
          if (indexRubro === -1) {
            rubros.push({ nombre: rubro, color: rubroColor || 'bg-gray-100 text-gray-800' });
          } else {
            // Actualizamos el color del rubro existente
            rubros[indexRubro].color = rubroColor;
          }
          await fs.writeFile(rubrosPath, JSON.stringify(rubros, null, 2));
        }
      }
    } catch (error) {
      console.error("Error actualizando proveedor:", error);
    }

    res.redirect('/proveedores');
  },

  eliminarRubro: async (req, res) => {
    if (!req.session.user) return res.status(401).json({success: false});
    const { nombre } = req.body;
    try {
      let rubros = await getRubros();
      const filtrados = rubros.filter(r => r.nombre !== nombre);
      await fs.writeFile(rubrosPath, JSON.stringify(filtrados, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Error eliminando rubro:", error);
      res.status(500).json({ success: false });
    }
  },

  eliminar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const { id } = req.params;
    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      let proveedores = JSON.parse(content);

      const index = proveedores.findIndex(p => p.id === id);
      if (index !== -1) {
        proveedores[index].activo = false;
        await fs.writeFile(proveedoresPath, JSON.stringify(proveedores, null, 2));
      }
    } catch (error) {
      console.error("Error eliminando proveedor:", error);
    }
    res.redirect('/proveedores');
  }
};

module.exports = proveedoresController;