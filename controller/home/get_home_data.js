import { CustomException, executeQuery, getFechaConHoraLocalDePais, getFechaLocalDePais } from "lightdata-tools";

export async function getHomeData({ db, req, company }) {
  // ───────────────────────────── Helpers de profiling ─────────────────────────────
  const t0All = process.hrtime.bigint();
  const toMs = (ns) => Number(ns) / 1e6;
  const now = () => process.hrtime.bigint();

  const summary = []; // [{ name, ms, extra }]
  const logStep = (name, startedAt, extra = {}) => {
    const ms = toMs(now() - startedAt);
    summary.push({ name, ms: Math.round(ms), ...extra });
    console.log(`🕒 [HomeData] ${name} -> ${ms.toFixed(2)} ms${Object.keys(extra).length ? ` | ${JSON.stringify(extra)}` : ""}`);
  };

  const timedQuery = async (name, queryObj, extra = {}) => {
    const t = now();
    const rows = await executeQuery(queryObj);
    logStep(name, t, { rows: rows?.length ?? 0, ...extra });
    return rows;
  };

  // ───────────────────────────── Inicio función ─────────────────────────────
  const tInit = now();
  let { profile, userId } = req.user;

  console.log(`🚀 [HomeData] start | userId=${userId} profile=${profile} company.did=${company.did} pais=${company?.pais}`);

  //! Esto es por el error que paso una vez que la app no tomaba el perfil
  if (profile == 0) {
    const tPerfil = now();
    const query = `SELECT perfil FROM sistema_usuarios_accesos WHERE superado = 0 AND elim = 0 AND usuario = ?`;
    const rows = await timedQuery("fetch perfil (fallback)", { dbConnection: db, query, values: [userId] });
    if (rows && rows.length > 0) {
      profile = parseInt(rows[0].perfil);
      logStep("parse perfil", tPerfil, { profile });
    } else {
      logStep("fetch perfil (fallback) - sin resultados", tPerfil);
      throw new CustomException({
        title: "Error al obtener perfil",
        message: `No se encontró el perfil del usuario con ID ${userId}`,
      });
    }
  }

  const dateConHora = getFechaConHoraLocalDePais(company.pais);
  const date = getFechaLocalDePais(company.pais);
  logStep("fechas locales calculadas", tInit, { date, dateConHora });

  const estadosPendientes =
    ({
      20: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 18],
      55: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13],
      72: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 16, 18, 16],
      default: [0, 1, 2, 3, 6, 7, 10, 11, 12],
    }[company.did] || [0, 1, 2, 3, 6, 7, 10, 11, 12, 13]);

  const estadosEnCamino =
    ({
      20: [2, 11, 12, 16],
      55: [2, 11, 12],
      72: [2, 11, 12],
      default: [2, 11, 12],
    }[company.did] || [2, 11, 12]);

  const estadosCerradosHoy =
    ({
      20: [5, 8, 9, 14, 17],
      55: [5, 8, 9, 14, 16],
      72: [5, 8, 9, 14],
      default: [5, 8, 9, 14],
    }[company.did] || [5, 8, 9, 14]);

  const estadosEntregadosHoy =
    ({
      20: [5, 9, 17],
      55: [5, 9, 16],
      72: [5, 9],
      default: [5, 9],
    }[company.did] || [5, 9]);

  console.log(
    `📦 [HomeData] estados | pendientes=${JSON.stringify(estadosPendientes)} enCamino=${JSON.stringify(
      estadosEnCamino
    )} cerradosHoy=${JSON.stringify(estadosCerradosHoy)} entregadosHoy=${JSON.stringify(estadosEntregadosHoy)}`
  );

  const infoADevolver = {
    assignedToday: 0,
    pendings: 0,
    onTheWay: 0,
    closedToday: 0,
    deliveredToday: 0,
  };

  async function fetchCount(query, label) {
    const rows = await timedQuery(label, { dbConnection: db, query });
    return rows && rows.length ? parseInt(rows[0].total, 10) : 0;
  }

  const tSwitch = now();
  switch (profile) {
    case 1:
    case 5: {
      const qAsignadosHoy = `
        SELECT COUNT(id) AS total 
        FROM envios_asignaciones 
        WHERE superado = 0 
          AND elim = 0 
          AND autofecha > '${date} 00:00:00'
      `;
      infoADevolver.assignedToday = await fetchCount(qAsignadosHoy, "case 1/5 - asignados hoy");

      const qPendientes = `
        SELECT didEnvio
        FROM envios_historial AS eh
        LEFT JOIN envios AS e ON (
          e.superado = 0
          AND e.elim = 0
          AND e.did = eh.didEnvio
        )
        WHERE e.elim = 0
          AND eh.elim = 0
          AND eh.superado = 0
          AND DATE(eh.fecha) BETWEEN DATE_SUB('${dateConHora}', INTERVAL 7 DAY) AND '${dateConHora}'
          AND eh.estado IN (${estadosPendientes})
      `;
      const rowsPend = await timedQuery("case 1/5 - pendientes últimos 7d", { dbConnection: db, query: qPendientes });
      infoADevolver.pendings = rowsPend.length;

      const qHistorial = `
        SELECT 
          SUM(CASE WHEN estado IN (${estadosEnCamino}) THEN 1 ELSE 0 END) AS enCamino,
          SUM(CASE WHEN estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS cerradosHoy,
          SUM(CASE WHEN estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS entregadosHoy
        FROM envios_historial 
        WHERE elim = 0 
          AND superado = 0 
          AND DATE(fecha) = CURDATE()
      `;
      const rowsHist = await timedQuery("case 1/5 - historial hoy", { dbConnection: db, query: qHistorial });
      if (rowsHist && rowsHist.length > 0) {
        infoADevolver.onTheWay = parseInt(rowsHist[0].enCamino, 10) || 0;
        infoADevolver.closedToday = parseInt(rowsHist[0].cerradosHoy, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsHist[0].entregadosHoy, 10) || 0;
      }
      break;
    }

    case 2: {
      const qCerradosEntregados = `
        SELECT
          SUM(CASE WHEN eh.estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS closedToday,
          SUM(CASE WHEN eh.estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS deliveredToday
        FROM envios_historial AS eh
        LEFT JOIN envios AS e 
          ON (e.did = eh.didEnvio AND e.superado = 0 AND e.elim = 0)
        LEFT JOIN sistema_usuarios_accesos AS sua 
          ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ${userId})
        WHERE DATE(eh.fecha) = CURDATE()
          AND eh.superado = 0
          AND eh.elim = 0
          AND e.didCliente = sua.codigo_empleado
      `;
      const rowsCE = await timedQuery("case 2 - cerrados/entregados hoy", { dbConnection: db, query: qCerradosEntregados });
      if (rowsCE && rowsCE.length > 0) {
        infoADevolver.closedToday = parseInt(rowsCE[0].closedToday, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsCE[0].deliveredToday, 10) || 0;
      }
      break;
    }

    case 3: {
      const qAsignadosHoy = `
        SELECT COUNT(id) AS total 
        FROM envios_asignaciones 
        WHERE operador = ${userId} 
          AND superado = 0 
          AND elim = 0 
          AND autofecha > '${date} 00:00:00'
      `;
      infoADevolver.assignedToday = await fetchCount(qAsignadosHoy, "case 3 - asignados hoy (operador)");

      const qPendientes = `
        SELECT didEnvio
        FROM envios_historial AS eh
        LEFT JOIN envios AS e ON (
          e.superado = 0
          AND e.elim = 0
          AND e.did = eh.didEnvio
          AND e.choferAsignado = ${userId}
        )
        WHERE e.elim = 0
          AND eh.elim = 0
          AND eh.superado = 0
          AND DATE(eh.fecha) BETWEEN DATE_SUB('${dateConHora}', INTERVAL 7 DAY) AND '${dateConHora}'
          AND eh.estado IN (${estadosPendientes})
        GROUP BY eh.didEnvio
      `;
      const rowsPendOp = await timedQuery("case 3 - pendientes últimos 7d (operador)", { dbConnection: db, query: qPendientes });
      infoADevolver.pendings = rowsPendOp.length;

      const qHistorial = `
        SELECT 
          SUM(CASE WHEN eh.estado IN (${estadosEnCamino}) THEN 1 ELSE 0 END) AS onTheWay,
          SUM(CASE WHEN eh.estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS closedToday,
          SUM(CASE WHEN eh.estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS deliveredToday
        FROM envios_historial AS eh
        LEFT JOIN envios AS e ON (
          e.superado = 0
          AND e.elim = 0
          AND e.choferAsignado = ${userId}
        )
        WHERE eh.elim = 0
          AND e.did = eh.didEnvio
          AND eh.superado = 0
          AND DATE(eh.fecha) = CURDATE()
      `;
      const rowsHistOp = await timedQuery("case 3 - historial hoy (operador)", { dbConnection: db, query: qHistorial });
      if (rowsHistOp && rowsHistOp.length > 0) {
        infoADevolver.onTheWay = parseInt(rowsHistOp[0].onTheWay, 10) || 0;
        infoADevolver.closedToday = parseInt(rowsHistOp[0].closedToday, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsHistOp[0].deliveredToday, 10) || 0;
      }
      break;
    }

    default:
      console.log(`ℹ️ [HomeData] perfil ${profile} sin bloque específico (sin consultas adicionales)`);
      break;
  }
  logStep("bloque switch(profile)", tSwitch, { profile });

  // startedRoute (solo si es chofer)
  let startedRoute;
  if (req.user.profile == 3) {
    const tStarted = now();
    const sqlCadetesMovimientos = `
      SELECT tipo 
      FROM cadetes_movimientos 
      WHERE didCadete = ? 
        AND DATE(autofecha) = CURDATE() 
      ORDER BY id DESC 
      LIMIT 1
    `;
    const result = await timedQuery("startedRoute - último movimiento del día", {
      dbConnection: db,
      query: sqlCadetesMovimientos,
      values: [userId],
    });

    if (result.length == 0) {
      startedRoute = false;
    } else {
      startedRoute = result[0].tipo == 0;
    }
    logStep("startedRoute - resuelto", tStarted, { startedRoute });
  } else {
    console.log("⏭️ [HomeData] startedRoute omitido (no es perfil 3)");
  }

  // Log final de métricas calculadas
  console.log(
    `✅ [HomeData] métricas: ${JSON.stringify(infoADevolver)}${req.user.profile == 3 ? ` | startedRoute=${startedRoute}` : ""}`
  );

  // Resumen ordenado por mayor tiempo
  const totalMs = toMs(now() - t0All);
  summary.sort((a, b) => b.ms - a.ms);
  console.log("📊 [HomeData] breakdown (ms desc):");
  try {
    console.table(summary);
  } catch {
    // si no hay soporte para table, lo mostramos en JSON
    console.log(JSON.stringify(summary, null, 2));
  }
  console.log(`⏱️ [HomeData] TOTAL -> ${totalMs.toFixed(2)} ms`);

  return {
    data: {
      homeData: infoADevolver,
      startedRoute,
    },
    message: "Datos obtenidos correctamente",
  };
}
