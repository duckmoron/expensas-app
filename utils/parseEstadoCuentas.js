// utils/parseEstadoCuentas.js
function parseEstadoCuentas(text) {
  if (!text || typeof text !== "string") {
    return { unidades: [], totales: {}, metadata: {} };
  }

  console.log("///////////////////////////////////////////////////");
  console.log("texto completo del pdf:", text);
  console.log("///////////////////////////////////////////////////");

  const inicioKey = "ESTADO DE CUENTAS Y PRORRATEO";
  const finKey = "Tasa de interés";

  const inicio = text.indexOf(inicioKey);
  const fin = text.indexOf(finKey);

  if (inicio === -1) {
    return { unidades: [], totales: {}, metadata: {} };
  }

  const bloque = text.substring(inicio, fin > -1 ? fin : undefined);
  const allLines = bloque
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const montoRegex = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
  const porcRegex = /^\d+,\d{2}$/;
  const isPorcentaje = (s) => porcRegex.test(s) && s.indexOf(".") === -1;

  // ==========================================================================
  // TOTALES (SIN CAMBIOS)
  // ==========================================================================
  const totalLine = allLines.find(l =>
    /^TOTAL/i.test(l) || l.toUpperCase().startsWith("TOTAL")
  );

  let totales = {};

  if (totalLine) {
    const nums = (totalLine.match(montoRegex) || []).map(x => x.trim());

    totales = {
      sdo_anterior: nums[0] || "",
      su_pago: nums[1] || "",
      sdo_pendiente: nums[2] || "",
      interes_total: nums[3] || "",
      exp_A: nums[5] || "",
      exp_B: nums[7] || "",
      exp_C: nums[9] || "",
      red: nums[10] || "",
      total_general: nums[nums.length - 1] || ""
    };
  }

  // ==========================================================================
  // UNIDADES (SIN CAMBIOS)
  // ==========================================================================
  const unitLines = allLines.filter(l => /^\d{3}/.test(l));
  const unidades = [];

  for (let rawLine of unitLines) {
    const raw = rawLine;

    const uni = rawLine.substring(0, 3);
    let resto = rawLine.substring(3).trim();

    let ps = "";
    if (resto.startsWith("LO")) {
      ps = "LO";
      resto = resto.substring(2).trim();
    } else if (resto.startsWith("PB")) {
      ps = "PB";
      resto = resto.substring(2).trim();
    } else if (/^[1-8]/.test(resto)) {
      ps = resto.charAt(0);
      resto = resto.substring(1).trim();
    }

    let dpto = "";
    if (resto.startsWith("LOC")) {
      dpto = "LOC";
      resto = resto.substring(3).trim();
    } else if (/^[A-D]/.test(resto)) {
      dpto = resto.charAt(0);
      resto = resto.substring(1).trim();
    }

    const nums = raw.match(montoRegex) || [];

    let sdo_anterior = nums[0] || "";
    let su_pago = "";
    let idx = 1;

    if (nums[1] && nums[1].trim().startsWith("-")) {
      su_pago = nums[1];
      idx = 2;
    } else {
      su_pago = "";
      idx = 1;
    }

    let sdo_pendiente = "";
    let interes = "";

    if (su_pago !== "") {
      while (idx < nums.length && !isPorcentaje(nums[idx])) {
        if (!sdo_pendiente) sdo_pendiente = nums[idx++];
        else if (!interes) interes = nums[idx++];
        else break;
      }
    } else {
      sdo_pendiente = nums[idx++] || "";
      interes = (nums[idx] && !isPorcentaje(nums[idx])) ? nums[idx++] : "";
    }

    let porc_A = "", exp_A = "";
    let porc_B = "", exp_B = "";
    let porc_C = "", exp_C = "";
    let red = "";

    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_A = nums[idx++] || "";
      exp_A = nums[idx++] || "";
    } else if (nums[idx] && nums[idx].indexOf(".") !== -1) {
      exp_A = nums[idx++] || "";
    }

    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_B = nums[idx++] || "";
      exp_B = nums[idx++] || "";
    } else if (nums[idx] && nums[idx].indexOf(".") !== -1) {
      exp_B = nums[idx++] || "";
    }

    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_C = nums[idx++] || "";
      exp_C = nums[idx++] || "";
    } else if (nums[idx] && nums[idx].indexOf(".") !== -1) {
      exp_C = nums[idx++] || "";
    }

    red = nums[idx] || "";
    const total = nums[nums.length - 1] || "";

    const firstMontoIndex = raw.search(montoRegex);
    let copropietario = "";

    if (firstMontoIndex > -1) {
      const restoStartIndex = raw.indexOf(resto);
      if (restoStartIndex !== -1 && firstMontoIndex > restoStartIndex) {
        copropietario = raw.substring(restoStartIndex, firstMontoIndex).trim();
      } else {
        copropietario = resto.replace(/\d.*$/, "").trim();
      }
    } else {
      copropietario = resto.replace(/\d.*$/, "").trim();
    }

    copropietario = copropietario.replace(/\s{2,}/g, " ").trim();

    const parseMonto = (s) =>
      Number(String(s || "0").replace(/\./g, "").replace(",", "."));

    const saldo_total =
      (parseMonto(sdo_pendiente) + parseMonto(interes))
        .toLocaleString("es-AR", { minimumFractionDigits: 2 });

    unidades.push({
      uni,
      ps,
      dpto,
      copropietario,
      sdo_anterior,
      su_pago,
      sdo_pendiente: sdo_pendiente || "0,00",
      interes: interes || "",
      saldo_total,
      porc_A,
      exp_A,
      porc_B,
      exp_B,
      porc_C,
      exp_C,
      red,
      total,
      raw
    });
  }

  // ==========================================================================
  // ====================== METADATA (NUEVO - AISLADO) =========================
  // ==========================================================================

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const findLine = (rx) => lines.find(l => rx.test(l)) || "";

  // -------------------- FIJOS --------------------
  const consorcio = {
    nombre: findLine(/CONSORCIO/i),
    direccion: findLine(/Domicilio del Consorcio/i).split(":")[1] || "",
    cuit: findLine(/CUIT:\s*30-/i),
    clave_suterh: findLine(/Clave SUTERH/i).split(":")[1] || ""
  };

  const administracion = {
    nombre: findLine(/ADM\./i),
    direccion: findLine(/YERBAL/i),
    mail: findLine(/@/i),
    telefono: findLine(/Te\.:/i),
    urgencias: findLine(/URG:/i),
    rpa: findLine(/R\.P\.A\.|RPA/i),
    cuit: findLine(/CUIT:\s*23-/i)
  };

  const banco = {
    entidad: findLine(/BANCO/i),
    sucursal: findLine(/SUCURSAL/i),
    cuenta: findLine(/CTA CTE/i),
    cbu: findLine(/CBU/i)
  };

  // -------------------- DINAMICOS --------------------
  const aviso_pago = {
    periodo: findLine(/Liquidacion de mes:/i).split(":")[1] || "",
    vencimiento: findLine(/Vencimiento:/i).split(":")[1] || ""
  };

  const gastos_mes = {
    total_gastos: findLine(/^TOTAL DE GASTOS/i).match(montoRegex)?.pop() || "",
    rubros: []
  };

  lines.forEach(l => {
    if (/Total Rubro/i.test(l)) {
      gastos_mes.rubros.push({
        raw: l,
        total: l.match(montoRegex)?.pop() || ""
      });
    }
  });

  const pagos_cobranzas = {
    saldo_inicial: findLine(/SALDO INICIAL/i).match(montoRegex)?.[0] || "",
    ingresos_expensas: findLine(/INGRESO POR EXPENSAS DEL MES/i).match(montoRegex)?.[0] || "",
    ingresos_atrasados: findLine(/INGRESO POR EXPENSAS ATRASADAS/i).match(montoRegex)?.[0] || "",
    ingresos_intereses: findLine(/INGRESO POR INTERESES/i).match(montoRegex)?.[0] || "",
    egresos: findLine(/EGRESOS DEL PERIODO/i).match(montoRegex)?.[0] || "",
    saldo_final: findLine(/SALDO FINAL/i).match(montoRegex)?.[0] || ""
  };

  const proveedores = [];
  let inProv = false;

  lines.forEach(l => {
    if (/Proveedores del Consorcio/i.test(l)) inProv = true;
    else if (inProv && /Pagina:/i.test(l)) inProv = false;
    else if (inProv && /\d{2}-\d{8}-\d/i.test(l)) {
      proveedores.push({ raw: l });
    }
  });

  // ==========================================================================
  // RETURN FINAL
  // ==========================================================================
  return {
    unidades,
    totales,
    metadata: {
      fijos: {
        consorcio,
        administracion,
        banco
      },
      dinamicos: {
        aviso_pago,
        gastos_mes,
        pagos_cobranzas,
        proveedores
      }
    }
  };
}

module.exports = { parseEstadoCuentas };
