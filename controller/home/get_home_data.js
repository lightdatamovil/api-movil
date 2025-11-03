import {
  executeQuery,
  getFechaConHoraLocalDePais,
  getFechaLocalDePais,
} from "lightdata-tools";

export async function getHomeData({ db, req, company }) {
  // ───── helpers logs/tiempos ─────
  const t0 = process.hrtime.bigint();
  const toMs = (ns) => Number(ns) / 1e6;
  const now = () => process.hrtime.bigint();
  const timed = async (label, q) => {
    const t = now();
    const rows = await executeQuery(q);
    console.log(`🕒 [HomeData] ${label} -> ${toMs(now() - t).toFixed(2)} ms | rows=${rows?.length ?? 0}`);
    return rows;
  };

  let { profile, userId } = req.user;

  // fechas sargables
  const dateConHora = getFechaConHoraLocalDePais(company.pais);
  const date = getFechaLocalDePais(company.pais);

  // rangos de fecha (hoy y últimos 7 días)
  const todayStart = `${date} 00:00:00`;
  const tomorrowStart = `${date} 23:59:59.999`; // si preferís estricto: calcula “mañana 00:00:00”
  const last7Start = new Date(new Date(dateConHora).getTime() - 7 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const nowStr = dateConHora;

  // estados (sin duplicados)
  const estadosPendientes =
    (
      {
        20: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 18],
        55: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13],
        72: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 16, 18],
        default: [0, 1, 2, 3, 6, 7, 10, 11, 12],
      }[company.did] || [0, 1, 2, 3, 6, 7, 10, 11, 12, 13]
    ).filter((x, i, a) => a.indexOf(x) === i);

  const estadosEnCamino =
    (
      {
        20: [2, 11, 12, 16],
        55: [2, 11, 12],
        72: [2, 11, 12],
        default: [2, 11, 12],
      }[company.did] || [2, 11, 12]
    ).filter((x, i, a) => a.indexOf(x) === i);

  const estadosCerradosHoy =
    (
      {
        20: [5, 8, 9, 14, 17],
        55: [5, 8, 9, 14, 16],
        72: [5, 8, 9, 14],
        default: [5, 8, 9, 14],
      }[company.did] || [5, 8, 9, 14]
    ).filter((x, i, a) => a.indexOf(x) === i);

  const estadosEntregadosHoy =
    (
      {
        20: [5, 9, 17],
        55: [5, 9, 16],
        72: [5, 9],
        default: [5, 9],
      }[company.did] || [5, 9]
    ).filter((x, i, a) => a.indexOf(x) === i);

  // helpers IN dinámico
  const inPlaceholders = (arr) => arr.map(() => "?").join(",");
  const infoADevolver = { assignedToday: 0, pendings: 0, onTheWay: 0, closedToday: 0, deliveredToday: 0 };

  // ───── casos por perfil ─────
  if (profile === 1 || profile === 5) {
    // asignados hoy (sargable)
    {
      const rows = await timed("1/5 - asignados hoy", {
        dbConnection: db,
        query: `
          SELECT COUNT(id) AS total
          FROM envios_asignaciones
          WHERE superado = 0
            AND elim = 0
            AND autofecha >= ? AND autofecha <= ?
        `,
        values: [todayStart, tomorrowStart],
      });
      infoADevolver.assignedToday = rows?.[0]?.total ? parseInt(rows[0].total, 10) : 0;
    }

    // pendientes últimos 7 días → COUNT DISTINCT (sin traer filas)
    {
      const ph = inPlaceholders(estadosPendientes);
      const rows = await timed("1/5 - pendientes 7d (COUNT DISTINCT)", {
        dbConnection: db,
        query: `
          SELECT COUNT(DISTINCT eh.didEnvio) AS total
          FROM envios_historial AS eh
          LEFT JOIN envios AS e
            ON e.did = eh.didEnvio
           AND e.superado = 0
           AND e.elim = 0
          WHERE eh.elim = 0
            AND eh.superado = 0
            AND eh.fecha >= ? AND eh.fecha <= ?
            AND eh.estado IN (${ph})
        `,
        values: [last7Start, nowStr, ...estadosPendientes],
      });
      infoADevolver.pendings = rows?.[0]?.total ? parseInt(rows[0].total, 10) : 0;
    }

    // onTheWay/closed/delivered hoy (sargable + CASE)
    {
      const phCamino = inPlaceholders(estadosEnCamino);
      const phCerr = inPlaceholders(estadosCerradosHoy);
      const phEntr = inPlaceholders(estadosEntregadosHoy);

      const rows = await timed("1/5 - historial hoy (CASE sums)", {
        dbConnection: db,
        query: `
          SELECT 
            SUM(CASE WHEN estado IN (${phCamino}) THEN 1 ELSE 0 END) AS enCamino,
            SUM(CASE WHEN estado IN (${phCerr})   THEN 1 ELSE 0 END) AS cerradosHoy,
            SUM(CASE WHEN estado IN (${phEntr})   THEN 1 ELSE 0 END) AS entregadosHoy
          FROM envios_historial
          WHERE elim = 0
            AND superado = 0
            AND fecha >= ? AND fecha <= ?
        `,
        values: [...estadosEnCamino, ...estadosCerradosHoy, ...estadosEntregadosHoy, todayStart, tomorrowStart],
      });
      if (rows?.length) {
        infoADevolver.onTheWay = parseInt(rows[0].enCamino || 0, 10);
        infoADevolver.closedToday = parseInt(rows[0].cerradosHoy || 0, 10);
        infoADevolver.deliveredToday = parseInt(rows[0].entregadosHoy || 0, 10);
      }
    }
  } else if (profile === 2) {
    // cerrados/entregados hoy del cliente del usuario
    const phCerr = inPlaceholders(estadosCerradosHoy);
    const phEnt = inPlaceholders(estadosEntregadosHoy);

    const rows = await timed("2 - cerrados/entregados hoy por cliente", {
      dbConnection: db,
      query: `
        SELECT
          SUM(CASE WHEN eh.estado IN (${phCerr}) THEN 1 ELSE 0 END) AS closedToday,
          SUM(CASE WHEN eh.estado IN (${phEnt}) THEN 1 ELSE 0 END) AS deliveredToday
        FROM envios_historial AS eh
        LEFT JOIN envios AS e
          ON e.did = eh.didEnvio
         AND e.superado = 0
         AND e.elim = 0
        LEFT JOIN sistema_usuarios_accesos AS sua
          ON sua.usuario = ?
         AND sua.superado = 0
         AND sua.elim = 0
        WHERE eh.superado = 0
          AND eh.elim = 0
          AND eh.fecha >= ? AND eh.fecha <= ?
          AND e.didCliente = sua.codigo_empleado
      `,
      values: [...estadosCerradosHoy, ...estadosEntregadosHoy, userId, todayStart, tomorrowStart],
    });

    if (rows?.length) {
      infoADevolver.closedToday = parseInt(rows[0].closedToday || 0, 10);
      infoADevolver.deliveredToday = parseInt(rows[0].deliveredToday || 0, 10);
    }
  } else if (profile === 3) {
    // asignados hoy al operador
    {
      const rows = await timed("3 - asignados hoy operador", {
        dbConnection: db,
        query: `
          SELECT COUNT(id) AS total
          FROM envios_asignaciones
          WHERE operador = ?
            AND superado = 0
            AND elim = 0
            AND autofecha >= ? AND autofecha <= ?
        `,
        values: [userId, todayStart, tomorrowStart],
      });
      infoADevolver.assignedToday = rows?.[0]?.total ? parseInt(rows[0].total, 10) : 0;
    }

    // pendientes (COUNT DISTINCT) para operador
    {
      const ph = inPlaceholders(estadosPendientes);
      const rows = await timed("3 - pendientes 7d operador (COUNT DISTINCT)", {
        dbConnection: db,
        query: `
          SELECT COUNT(DISTINCT eh.didEnvio) AS total
          FROM envios_historial AS eh
          LEFT JOIN envios AS e ON (
            e.did = eh.didEnvio
            AND e.superado = 0
            AND e.elim = 0
            AND e.choferAsignado = ?
          )
          WHERE eh.elim = 0
            AND eh.superado = 0
            AND eh.fecha >= ? AND eh.fecha <= ?
            AND eh.estado IN (${ph})
        `,
        values: [userId, last7Start, nowStr, ...estadosPendientes],
      });
      infoADevolver.pendings = rows?.[0]?.total ? parseInt(rows[0].total, 10) : 0;
    }

    // onTheWay/closed/delivered hoy del operador
    {
      const phCamino = inPlaceholders(estadosEnCamino);
      const phCerr = inPlaceholders(estadosCerradosHoy);
      const phEntr = inPlaceholders(estadosEntregadosHoy);

      const rows = await timed("3 - historial hoy operador (CASE sums)", {
        dbConnection: db,
        query: `
          SELECT 
            SUM(CASE WHEN eh.estado IN (${phCamino}) THEN 1 ELSE 0 END) AS onTheWay,
            SUM(CASE WHEN eh.estado IN (${phCerr})   THEN 1 ELSE 0 END) AS closedToday,
            SUM(CASE WHEN eh.estado IN (${phEntr})   THEN 1 ELSE 0 END) AS deliveredToday
          FROM envios_historial AS eh
          LEFT JOIN envios AS e ON (
            e.superado = 0
            AND e.elim = 0
            AND e.choferAsignado = ?
            AND e.did = eh.didEnvio
          )
          WHERE eh.elim = 0
            AND eh.superado = 0
            AND eh.fecha >= ? AND eh.fecha <= ?
        `,
        values: [
          ...estadosEnCamino,
          ...estadosCerradosHoy,
          ...estadosEntregadosHoy,
          userId,
          todayStart,
          tomorrowStart,
        ],
      });

      if (rows?.length) {
        infoADevolver.onTheWay = parseInt(rows[0].onTheWay || 0, 10);
        infoADevolver.closedToday = parseInt(rows[0].closedToday || 0, 10);
        infoADevolver.deliveredToday = parseInt(rows[0].deliveredToday || 0, 10);
      }
    }
  }

  // startedRoute sólo perfil 3
  let startedRoute;
  if (req.user.profile == 3) {
    const rows = await timed("startedRoute - último del día", {
      dbConnection: db,
      query: `
        SELECT tipo
        FROM cadetes_movimientos
        WHERE didCadete = ?
          AND autofecha >= ? AND autofecha <= ?
        ORDER BY id DESC
        LIMIT 1
      `,
      values: [userId, todayStart, tomorrowStart],
    });
    startedRoute = rows.length ? rows[0].tipo == 0 : false;
  }

  console.log(`✅ [HomeData] ${JSON.stringify(infoADevolver)}${req.user.profile == 3 ? ` | startedRoute=${startedRoute}` : ""}`);
  console.log(`⏱️ [HomeData] TOTAL ${toMs(process.hrtime.bigint() - t0).toFixed(2)} ms`);

  return {
    data: { homeData: infoADevolver, startedRoute },
    message: "Datos obtenidos correctamente",
  };
}
