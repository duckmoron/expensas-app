const path = require('path');
const fs = require('fs').promises;

const proveedoresPath = path.join(__dirname, '../json/proveedores.json');

const proveedoresController = {
  index: async (req, res) => {
    let proveedores = [];

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      const todos = JSON.parse(content);
      proveedores = todos; // Enviamos todos para filtrar en la vista
    } catch (error) {
      console.error("Nota: No se pudo leer proveedores.json o no existe.", error.message);
    }

    res.render("proveedores/index", {
      title: "Proveedores",
      proveedores
    });
  },

  nuevo: (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    res.render("proveedores/nuevo", {
      title: "Nuevo Proveedor",
      error: null,
      formData: {}
    });
  },

  guardar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const { nombre, rubro, cuit, direccion, telefono, email, contacto, observaciones, estrellas } = req.body;

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      let proveedores = JSON.parse(content);

      // Validar si el CUIT ya existe
      if (cuit && proveedores.some(p => p.cuit === cuit)) {
        return res.render("proveedores/nuevo", {
          title: "Nuevo Proveedor",
          error: "El CUIT ingresado ya existe en la base de datos.",
          formData: req.body
        });
      }

      // Usamos el CUIT como ID si existe, sino generamos uno temporal
      const id = cuit ? cuit : Date.now().toString();

      const nuevoProveedor = {
        id,
        nombre, rubro, cuit, direccion, telefono, email, contacto, observaciones, estrellas: parseInt(estrellas) || 0,
        activo: true
      };

      proveedores.push(nuevoProveedor);
      await fs.writeFile(proveedoresPath, JSON.stringify(proveedores, null, 2));
    } catch (error) {
      console.error("Error guardando proveedor:", error);
    }
    res.redirect('/proveedores');
  },

  editar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    let proveedores = [];
    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      proveedores = JSON.parse(content);
    } catch (error) {
      console.error(error);
    }

    const proveedor = proveedores.find(p => p.id === req.params.id);

    if (!proveedor) {
      return res.redirect('/proveedores');
    }

    res.render("proveedores/editar", {
      title: "Editar Proveedor",
      proveedor
    });
  },

  actualizar: async (req, res) => {
    if (!req.session.user) return res.redirect('/proveedores');
    const { id } = req.params;
    const { nombre, rubro, cuit, direccion, telefono, email, contacto, observaciones, estrellas } = req.body;

    try {
      const content = await fs.readFile(proveedoresPath, 'utf-8');
      let proveedores = JSON.parse(content);

      // Validar si el CUIT ya existe en otro proveedor diferente
      if (cuit && proveedores.some(p => p.cuit === cuit && p.id !== id)) {
        return res.render("proveedores/editar", {
          title: "Editar Proveedor",
          proveedor: { id, ...req.body }, // Mantenemos los datos ingresados
          error: "El CUIT ingresado ya pertenece a otro proveedor."
        });
      }

      const index = proveedores.findIndex(p => p.id === id);
      if (index !== -1) {
        proveedores[index] = {
          ...proveedores[index],
          nombre, rubro, cuit, direccion, telefono, email, contacto, observaciones, estrellas: parseInt(estrellas) || 0
        };
        await fs.writeFile(proveedoresPath, JSON.stringify(proveedores, null, 2));
      }
    } catch (error) {
      console.error("Error actualizando proveedor:", error);
    }

    res.redirect('/proveedores');
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