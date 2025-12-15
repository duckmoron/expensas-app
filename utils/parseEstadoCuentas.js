// utils/parseEstadoCuentas.js
function parseEstadoCuentas(text) {
  if (!text || typeof text !== "string") return { unidades: [], totales: {} };

  const inicioKey = "ESTADO DE CUENTAS Y PRORRATEO";
  const finKey = "Tasa de interés";

  const inicio = text.indexOf(inicioKey);
  const fin = text.indexOf(finKey);

  if (inicio === -1) return { unidades: [], totales: {} };

  const bloque = text.substring(inicio, fin > -1 ? fin : undefined);
  const allLines = bloque.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const montoRegex = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
  const porcRegex = /^\d+,\d{2}$/;
  const isPorcentaje = (s) => porcRegex.test(s) && s.indexOf(".") === -1;

  // ==========================================================================
  // TOTALES
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
  // UNIDADES
  // ==========================================================================
  const unitLines = allLines.filter(l => /^\d{3}/.test(l));
  const unidades = [];

  for (let rawLine of unitLines) {
    const raw = rawLine;

    // UNI
    const uni = rawLine.substring(0, 3);

    // RESTO después de la UNI
    let resto = rawLine.substring(3).trim();

    // PS
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

    // DPTO
    let dpto = "";
    if (resto.startsWith("LOC")) {
      dpto = "LOC";
      resto = resto.substring(3).trim();
    } else if (/^[A-D]/.test(resto)) {
      dpto = resto.charAt(0);
      resto = resto.substring(1).trim();
    }

    // ==========================================================================
    // MONTOS
    // ==========================================================================
    const nums = raw.match(montoRegex) || [];

    // Siempre existe sdo_anterior
    let sdo_anterior = nums[0] || "";

    // Detectar SU_PAGO correctamente
    let su_pago = "";
    let idx = 1;

    if (nums[1] && nums[1].trim().startsWith("-")) {
      // Caso normal
      su_pago = nums[1];
      idx = 2;
    } else {
      // Caso unidad 010 → SU PAGO vacío
      su_pago = "";
      idx = 1; // La columna siguiente pertenece a sdo_pendiente
    }

    // Capturar sdo_pendiente e interes
    let sdo_pendiente = "";
    let interes = "";

    if (su_pago !== "") {
      // Caso normal: SU PAGO existe
      while (idx < nums.length && !isPorcentaje(nums[idx])) {
        if (!sdo_pendiente) sdo_pendiente = nums[idx++];
        else if (!interes)  interes = nums[idx++];
        else break;
      }
    } else {
      // Caso SU PAGO vacío (unidad 010)
      sdo_pendiente = nums[idx++] || "";
      interes       = (nums[idx] && !isPorcentaje(nums[idx])) ? nums[idx++] : "";
    }

    // ==========================================================================
    // %A / expA / %B / expB / %C / expC
    // (igual que tu parser original)
    // ==========================================================================
    let porc_A = "";
    let exp_A = "";
    let porc_B = "";
    let exp_B = "";
    let porc_C = "";
    let exp_C = "";
    let red = "";

    // A
    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_A = nums[idx++] || "";
      exp_A  = nums[idx++] || "";
    } else {
      if (nums[idx] && nums[idx].indexOf(".") !== -1) {
        exp_A = nums[idx++] || "";
      }
    }

    // B
    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_B = nums[idx++] || "";
      exp_B  = nums[idx++] || "";
    } else {
      if (nums[idx] && nums[idx].indexOf(".") !== -1) {
        exp_B = nums[idx++] || "";
      }
    }

    // C
    if (nums[idx] && isPorcentaje(nums[idx])) {
      porc_C = nums[idx++] || "";
      exp_C  = nums[idx++] || "";
    } else {
      if (nums[idx] && nums[idx].indexOf(".") !== -1) {
        exp_C = nums[idx++] || "";
      }
    }

    // RED
    red = nums[idx] || "";

    // TOTAL (último monto)
    const total = nums[nums.length - 1] || "";

    // ==========================================================================
    // NOMBRE (idéntico a tu parser original)
    // ==========================================================================
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

    // ==========================================================================
    // SALDO TOTAL (pendiente + interés)
    // ==========================================================================
    const fixPend = (v) => v && v !== "" ? v : "0,00";
    const fix = (v) => v || "";

    const parseMonto = (s) =>
      Number(String(s || "0").replace(/\./g, "").replace(",", "."));

    const saldo_total =
      (parseMonto(sdo_pendiente) + parseMonto(interes))
        .toLocaleString("es-AR", { minimumFractionDigits: 2 });

    // ==========================================================================
    // PUSH
    // ==========================================================================
    unidades.push({
      uni,
      ps,
      dpto,
      copropietario,
      sdo_anterior,
      su_pago,
      sdo_pendiente: fixPend(sdo_pendiente),
      interes: fix(interes),
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

  return { unidades, totales };
};

module.exports = { parseEstadoCuentas };
