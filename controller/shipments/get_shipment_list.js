import { CustomException, executeQuery, getFechaLocalDePais, Status, toBool, toStr } from "lightdata-tools";
import { companiesService } from "../../db.js";

export async function shipmentList(dbConnection, req, company) {
  // ---------- Helpers ----------
  const q = req.query;

  // Normaliza fechas DD/MM/YYYY -> YYYY-MM-DD; si ya viene YYYY-MM-DD, la deja igual
  const normalizeDate = (s) => {
    if (!s) return undefined;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const latam = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (latam) return `${latam[3]}-${latam[2]}-${latam[1]}`;
    return undefined; // formato inválido
  };
  // Acepta ?shipmentStates=1,2,3 o repetidos ?shipmentStates=1&shipmentStates=2
  const parseStates = (v) => {
    if (v === undefined || v === null) return [];
    const raw = Array.isArray(v) ? v.flat() : String(v).split(",");
    const nums = raw
      .map((x) => parseInt(String(x).trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
    return [...new Set(nums)];
  };

  // ---------- Query params ----------
  const fromDate = normalizeDate(toStr(q.from));
  const toDate = normalizeDate(toStr(q.to));
  const shipmentStates = parseStates(q.shipmentStates);
  const isAssignedToday = toBool(q.isAssignedToday, false);

  // ---------- Perfil ----------
  let { userId, profile } = req.user;
  if (profile == 0) {
    const rows = await executeQuery({
      dbConnection,
      query: `SELECT perfil FROM sistema_usuarios_accesos WHERE superado = 0 AND elim = 0 AND usuario = ?`,
      values: [userId]
    });
    if (rows && rows.length > 0) {
      profile = parseInt(rows[0].perfil);
    } else {
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
      message: "Debe seleccionar al menos un estado de envío (query param shipmentStates).",
      status: Status.badRequest,
    });
  }
  if (!isAssignedToday && !fromDate) {
    throw new CustomException({
      title: "Fecha inválida o ausente",
      message:
        "El query param 'from' es obligatorio cuando isAssignedToday=false. Formatos aceptados: YYYY-MM-DD o DD/MM/YYYY.",
      status: Status.badRequest,
    });
  }

  const date = getFechaLocalDePais(company.pais);

  // ---------- Datos auxiliares ----------
  const clientes = await companiesService.getClientsByCompany(dbConnection, company.did);
  const drivers = await companiesService.getDriversByCompany(dbConnection, company.did);

  // ---------- Condiciones dinámicas por perfil ----------
  let sqlChoferRuteo = "";
  let leftJoinCliente = "";
  let sqlDueno = "";
  let estadoAsignacionCol = "";
  const params = [];

  if (profile == 2) {
    // Vendedor: join con sua y filtra por didCliente = sua.codigo_empleado
    leftJoinCliente =
      "LEFT JOIN sistema_usuarios_accesos as sua ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ?)";
    params.push(userId);
    sqlDueno = "AND e.didCliente = sua.codigo_empleado";
  } else if (profile == 3) {
    // Chofer: filtra por chofer asignado y ruteo por chofer
    sqlDueno = "AND e.choferAsignado = ?";
    params.push(userId);
    sqlChoferRuteo = " AND r.didChofer = ?";
    params.push(userId);
  }

  if (company.did == 4) {
    estadoAsignacionCol = "e.estadoAsignacion,";
  }

  // ---------- Filtros por fecha (isAssignedToday) ----------
  // 'b' va dentro del JOIN a envios_asignaciones
  // 'c' va en el WHERE principal
  let joinEAExtra = "";
  let whereFecha = "";
  if (isAssignedToday) {
    joinEAExtra = "AND ea.autofecha > ?";
    whereFecha = "AND ea.autofecha > ?";
  } else {
    whereFecha = "AND eh.fecha BETWEEN ? AND ?";
  }

  // ---------- Armar SQL ----------
  const estadosPlaceholders = shipmentStates.map(() => "?").join(",");
  const sql = `
    SELECT
      e.did as didEnvio,
      e.flex,
      e.ml_shipment_id,
      e.ml_venta_id,
      eh.estado,
      e.didCliente,
      DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio,
      DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial,
      ${estadoAsignacionCol} e.destination_receiver_name,
      e.destination_shipping_address_line as address_line,
      edd.address_line as address_lineEDD,
      e.destination_shipping_zip_code as cp,
      edd.cp as cpEDD,
      e.destination_city_name as localidad,
      edd.localidad as localidadEDD,
      edd.provincia,
      e.destination_receiver_phone,
      ROUND(e.destination_latitude, 8) as lat,
      ROUND(e.destination_longitude, 8) AS lng,
      ei.valor as logisticainversa,
      e.destination_comments,
      edd.destination_comments AS destination_commentsEDD,
      rp.orden,
      ec.didCampoCobranza,
      e.choferAsignado,
      ec.valor
    FROM envios_historial as eh
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
    ${isAssignedToday ? "" : "LEFT"} JOIN envios_asignaciones as ea ON (
      ea.superado = 0
      AND ea.elim = 0
      AND ea.didEnvio = eh.didEnvio
      ${joinEAExtra}
    )
    LEFT JOIN ruteo as r ON (
      r.elim = 0
      AND r.superado = 0
      AND r.fechaOperativa = CURDATE() ${sqlChoferRuteo}
    )
    LEFT JOIN ruteo_paradas AS rp ON (
      rp.superado = 0
      AND rp.elim = 0
      AND rp.didPaquete = eh.didEnvio
      AND rp.didRuteo = r.did
      AND rp.autofecha LIKE ?
    )
    LEFT JOIN envios_cobranzas as ec ON (
      ec.elim = 0
      AND ec.superado = 0
      AND ec.didEnvio = eh.didEnvio
      AND ec.didCampoCobranza = 4
    )
    LEFT JOIN envios_direcciones_destino as edd ON (
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
      ${sqlDueno}
      AND eh.estado IN (${estadosPlaceholders})
    GROUP BY eh.didEnvio
    ORDER BY rp.orden ASC
  `;

  // ---------- Parámetros ----------
  // joinEAExtra (si corresponde)
  const paramsFinal = [...params];
  if (isAssignedToday) {
    paramsFinal.push(`${date} 00:00:00`); // para joinEAExtra
  }
  // rp.autofecha like 'YYYY-MM-DD%'
  paramsFinal.push(`${date}%`);
  // whereFecha
  if (isAssignedToday) {
    paramsFinal.push(`${date} 00:00:00`);
  } else {
    paramsFinal.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
  }
  // estados
  paramsFinal.push(...shipmentStates);

  const rows = await executeQuery({ dbConnection, query: sql, values: paramsFinal });

  // ---------- Mapeo ----------
  const lista = [];
  for (const row of rows) {
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

    const nombre = clientes[row.didCliente]
      ? clientes[row.didCliente].nombre
      : "Cliente no encontrado";

    const nombreChofer = drivers[row.choferAsignado]
      ? drivers[row.choferAsignado].nombre
      : "Chofer no encontrado";

    // Usamos 'estado' seleccionado (eh.estado) para la lógica
    const estadoNum = row.estado * 1;
    const isOnTheWay =
      estadoNum === 2 ||
      estadoNum === 11 ||
      estadoNum === 12 ||
      (company.did == 20 && estadoNum === 16);

    lista.push({
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
    });
  }

  return { data: lista, message: "Datos obtenidos correctamente" };
}
