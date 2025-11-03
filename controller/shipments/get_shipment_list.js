import {
  CustomException,
  executeQuery,
  getFechaLocalDePais,
  Status,
  toBool,
  toStr,
} from "lightdata-tools";
import { companiesService } from "../../db.js";

// --- helpers ---
const reISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const reLATAM = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const normalizeDate = (s) => {
  if (!s) return undefined;
  const str = String(s).trim();
  const iso = reISO.exec(str);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const latam = reLATAM.exec(str);
  if (latam) return `${latam[3]}-${latam[2]}-${latam[1]}`;
  return undefined;
};

const parseStates = (v) => {
  if (v === undefined || v === null) return [];
  const raw = Array.isArray(v) ? v.flat() : String(v).split(",");
  const nums = raw
    .map((x) => parseInt(String(x).trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return [...new Set(nums)];
};

const startOfDayStr = (yyyy_mm_dd) => `${yyyy_mm_dd} 00:00:00`;
const nextDayStr = (yyyy_mm_dd) => {
  const d = new Date(`${yyyy_mm_dd}T00:00:00`);
  const next = new Date(d.getTime() + 24 * 3600 * 1000);
  return next.toISOString().slice(0, 19).replace("T", " ");
};

export async function shipmentList({ db, req, company }) {
  const q = req.query;

  // ---------- Query params ----------
  const fromDate = normalizeDate(toStr(q.from));
  const toDateNorm = normalizeDate(toStr(q.to));
  const toDate = toDateNorm || fromDate; // si no mandan 'to', usamos 'from'
  const shipmentStates = parseStates(q.shipmentStates);
  const isAssignedToday = toBool(q.isAssignedToday, false);

  // ---------- Perfil ----------
  let { userId, profile } = req.user;
  if (profile == 0) {
    const rows = await executeQuery({
      db,
      query: `
        SELECT perfil
        FROM sistema_usuarios_accesos
        WHERE superado = 0 AND elim = 0 AND usuario = ?
      `,
      values: [userId],
    });
    if (rows?.length) profile = parseInt(rows[0].perfil, 10);
    else {
      throw new CustomException({
        title: "Error al obtener perfil",
        message: `No se encontró el perfil del usuario con ID ${userId}`,
      });
    }
  }

  // ---------- Validaciones ----------
  if (!shipmentStates.length) {
    throw new CustomException({
      title: "Error en los estados",
      message:
        "Debe seleccionar al menos un estado de envío (query param shipmentStates).",
      status: Status.badRequest,
    });
  }
  if (!isAssignedToday && !fromDate) {
    throw new CustomException({
      title: "Fecha inválida o ausente",
      message:
        "El query param 'from' es obligatorio cuando isAssignedToday=false. Formatos: YYYY-MM-DD o DD/MM/YYYY.",
      status: Status.badRequest,
    });
  }

  const today = getFechaLocalDePais(company.pais); // YYYY-MM-DD local
  const todayStart = startOfDayStr(today);
  const todayNext = nextDayStr(today);

  // Rango de filtros
  let rangeStart, rangeEnd;
  if (isAssignedToday) {
    // se filtra por asignación de hoy
    rangeStart = todayStart;
    rangeEnd = todayNext;
  } else {
    rangeStart = startOfDayStr(fromDate);
    rangeEnd = nextDayStr(toDate);
  }

  // ---------- Datos auxiliares ----------
  // (si estos servicios traen mapas grandes, podés hacer lazy-map al final)
  const clientes = await companiesService.getClientsByCompany({
    db,
    companyId: company.did,
  });
  const drivers = await companiesService.getDriversByCompany({
    db,
    companyId: company.did,
  });

  // ---------- Condiciones por perfil ----------
  let leftJoinCliente = "";
  let whereDueñoChofer = "";
  const paramsHead = [];

  if (profile == 2) {
    // vendedor → cliente = sua.codigo_empleado
    leftJoinCliente =
      "LEFT JOIN sistema_usuarios_accesos AS sua ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ?)";
    paramsHead.push(userId);
    whereDueñoChofer = "AND e.didCliente = sua.codigo_empleado";
  } else if (profile == 3) {
    // chofer
    whereDueñoChofer = "AND e.choferAsignado = ?";
    paramsHead.push(userId);
  }

  const estadoAsignacionCol = company.did == 4 ? "e.estadoAsignacion," : "";

  // ---------- JOINs dependientes de isAssignedToday ----------
  // - Si isAssignedToday=true => INNER JOIN a envios_asignaciones y filtro por rango en esa tabla.
  // - Si isAssignedToday=false => LEFT JOIN (para no filtrar por asignación) y fechas sobre eh.
  const joinEA =
    isAssignedToday
      ? `
        INNER JOIN envios_asignaciones AS ea ON (
          ea.superado = 0
          AND ea.elim = 0
          AND ea.didEnvio = eh.didEnvio
          AND ea.autofecha >= ? AND ea.autofecha < ?
        )
      `
      : `
        LEFT JOIN envios_asignaciones AS ea ON (
          ea.superado = 0
          AND ea.elim = 0
          AND ea.didEnvio = eh.didEnvio
        )
      `;

  // ruteo del día (si es chofer, filtra por él)
  const joinRuteo =
    profile == 3
      ? `
        LEFT JOIN ruteo AS r ON (
          r.elim = 0
          AND r.superado = 0
          AND r.fechaOperativa = CURDATE()
          AND r.didChofer = ?
        )
      `
      : `
        LEFT JOIN ruteo AS r ON (
          r.elim = 0
          AND r.superado = 0
          AND r.fechaOperativa = CURDATE()
        )
      `;
  if (profile == 3) paramsHead.push(userId);

  // ruteo_paradas → filtra por día con rango (evita LIKE)
  const joinParadas = `
    LEFT JOIN ruteo_paradas AS rp ON (
      rp.superado = 0
      AND rp.elim = 0
      AND rp.didPaquete = eh.didEnvio
      AND rp.didRuteo = r.did
      AND rp.autofecha >= ? AND rp.autofecha < ?
    )
  `;

  // filtros fecha a nivel WHERE
  const whereFecha =
    isAssignedToday
      ? "" // ya filtramos por fecha en ea (INNER)
      : "AND eh.fecha >= ? AND eh.fecha < ?";

  // placeholders IN estados
  const estadosPH = shipmentStates.map(() => "?").join(",");

  // ---------- SQL ----------
  const sql = `
    SELECT
      e.did AS didEnvio,
      e.flex,
      e.ml_shipment_id,
      e.ml_venta_id,
      eh.estado,
      e.didCliente,
      DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha_inicio,
      DATE_FORMAT(eh.autofecha, '%d/%m/%Y') AS fecha_historial,
      ${estadoAsignacionCol}
      e.destination_receiver_name,
      e.destination_shipping_address_line AS address_line,
      edd.address_line AS address_lineEDD,
      e.destination_shipping_zip_code AS cp,
      edd.cp AS cpEDD,
      e.destination_city_name AS localidad,
      edd.localidad AS localidadEDD,
      edd.provincia,
      e.destination_receiver_phone,
      ROUND(e.destination_latitude, 8) AS lat,
      ROUND(e.destination_longitude, 8) AS lng,
      ei.valor AS logisticainversa,
      e.destination_comments,
      edd.destination_comments AS destination_commentsEDD,
      rp.orden,
      ec.didCampoCobranza,
      e.choferAsignado,
      ec.valor
    FROM envios_historial AS eh
    LEFT JOIN envios AS e ON (
      e.superado = 0
      AND e.elim = 0
      AND e.did = eh.didEnvio
    )
    LEFT JOIN envios_logisticainversa AS ei ON (
      ei.superado = 0
      AND ei.elim = 0
      AND ei.didEnvio = eh.didEnvio
    )
    ${joinEA}
    ${joinRuteo}
    ${joinParadas}
    LEFT JOIN envios_cobranzas AS ec ON (
      ec.elim = 0
      AND ec.superado = 0
      AND ec.didEnvio = eh.didEnvio
      AND ec.didCampoCobranza = 4
    )
    LEFT JOIN envios_direcciones_destino AS edd ON (
      edd.superado = 0
      AND edd.elim = 0
      AND edd.didEnvio = eh.didEnvio
    )
    ${leftJoinCliente}
    WHERE
      eh.superado = 0
      AND eh.elim = 0
      AND e.elim = 0
      ${whereFecha}
      ${whereDueñoChofer}
      AND eh.estado IN (${estadosPH})
    GROUP BY eh.didEnvio
    ORDER BY rp.orden ASC
  `;

  // ---------- Parámetros ----------
  const vals = [...paramsHead];

  // fechas en JOIN ea
  if (isAssignedToday) {
    vals.push(todayStart, todayNext);
  }

  // fechas en JOIN rp.autofecha (siempre del día actual)
  vals.push(todayStart, todayNext);

  // fechas del WHERE principal si no es por asignación de hoy
  if (!isAssignedToday) {
    vals.push(rangeStart, rangeEnd);
  }

  // estados
  vals.push(...shipmentStates);

  const rows = await executeQuery({
    db,
    query: sql,
    values: vals,
  });

  // ---------- Mapeo ----------
  const lista = rows.map((row) => {
    const direccion1 =
      row.address_line && String(row.address_line).trim() !== ""
        ? row.address_line
        : row.address_lineEDD;

    const cp =
      row.cp && String(row.cp).trim() !== "" ? row.cp : row.cpEDD;

    const localidad =
      row.localidad && String(row.localidad).trim() !== ""
        ? row.localidad
        : row.localidadEDD;

    const observacionDestinatario =
      row.destination_comments && String(row.destination_comments).trim() !== ""
        ? row.destination_comments
        : row.destination_commentsEDD;

    const lat = row.lat !== "0" ? row.lat : "0";
    const long = row.lng !== "0" ? row.lng : "0";
    const logisticainversa = row.logisticainversa != null;
    const estadoAsignacionVal = row.estadoAsignacion || 0;
    const monto = row.valor || 0;

    const nombre =
      clientes[row.didCliente]?.nombre ?? "Cliente no encontrado";
    const nombreChofer =
      drivers[row.choferAsignado]?.nombre ?? "Chofer no encontrado";

    const estadoNum = row.estado * 1;
    const isOnTheWay =
      estadoNum === 2 ||
      estadoNum === 11 ||
      estadoNum === 12 ||
      (company.did == 20 && estadoNum === 16);

    return {
      didEnvio: row.didEnvio * 1,
      flex: row.flex * 1,
      shipmentid: row.ml_shipment_id,
      ml_venta_id: row.ml_venta_id,
      estado: estadoNum,
      nombreCliente: nombre,
      didCliente: row.didCliente * 1,
      fechaEmpresa: row.fecha_inicio,
      fechaHistorial: row.fecha_historial || null,
      estadoAsignacion: estadoAsignacionVal * 1,
      nombreDestinatario: row.destination_receiver_name,
      direccion1,
      direccion2: `CP ${cp}, ${localidad} `,
      provincia: row.provincia || "Sin provincia",
      telefono: row.destination_receiver_phone,
      lat,
      long,
      logisticainversa,
      observacionDestinatario,
      hasNextDeliverButton: isOnTheWay && row.proximaentregaId == null,
      orden: row.orden * 1,
      chofer: nombreChofer,
      choferId: row.choferAsignado * 1,
      cobranza: monto != 0.0 && monto != 0 ? row.didCampoCobranza : 0,
      monto_a_cobrar: monto,
    };
  });

  return { data: lista, message: "Datos obtenidos correctamente" };
}
