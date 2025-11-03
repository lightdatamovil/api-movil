import { executeQuery, getFechaConHoraLocalDePais, getFechaLocalDePais } from "lightdata-tools";
import { performance } from "node:perf_hooks";

export async function getHomeData({ db, req, company }) {
  const perfMarks = [];
  const tAllStart = performance.now();
  const mark = (label, start) => {
    const ms = performance.now() - start;
    perfMarks.push({ label, ms: Number(ms.toFixed(2)) });
  };

  // Helper genérico para cronometrar tareas async
  async function timed(label, fn) {
    const t0 = performance.now();
    try {
      return await fn();
    } finally {
      mark(label, t0);
    }
  }

  let { profile, userId } = req.user;

  const tFechas = performance.now();
  const dateConHora = getFechaConHoraLocalDePais(company.pais);
  const date = getFechaLocalDePais(company.pais);
  mark("calculo_fechas_locales", tFechas);

  const estadosPendientes = {
    // todo revisar estadosPendientes de rabion -- agregamos 18 : nadie en 3ra visita
    20: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 18],
    55: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13],
    // todo revisar 1 o existe en  wynflex
    72: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 16, 18, 16],
    default: [0, 1, 2, 3, 6, 7, 10, 11, 12],
  }[company.did] || [0, 1, 2, 3, 6, 7, 10, 11, 12, 13];

  const estadosEnCamino = {
    20: [2, 11, 12, 16],
    55: [2, 11, 12],
    72: [2, 11, 12],
    default: [2, 11, 12],
  }[company.did] || [2, 11, 12];

  const estadosCerradosHoy = {
    20: [5, 8, 9, 14, 17],
    55: [5, 8, 9, 14, 16],
    72: [5, 8, 9, 14],
    default: [5, 8, 9, 14],
  }[company.did] || [5, 8, 9, 14];

  const estadosEntregadosHoy = {
    20: [5, 9, 17],
    55: [5, 9, 16],
    72: [5, 9],
    default: [5, 9],
  }[company.did] || [5, 9];

  const infoADevolver = {
    assignedToday: 0,
    pendings: 0,
    onTheWay: 0,
    closedToday: 0,
    deliveredToday: 0,
  };

  async function fetchCount(query, label) {
    const rows = await timed(label, () => executeQuery({ dbConnection: db, query }));
    return rows && rows.length ? parseInt(rows[0].total, 10) : 0;
  }

  switch (profile) {
    case 1:
    case 5: {
      // ASIGNADOS HOY
      const queryAsignadosHoy = `
        SELECT COUNT(id) AS total 
        FROM envios_asignaciones 
        WHERE superado = 0 
          AND elim = 0 
          AND autofecha > '${date} 00:00:00'
      `;
      infoADevolver.assignedToday = await fetchCount(queryAsignadosHoy, "q_asignados_hoy");

      // PENDIENTES (últimos 7 días)
      const queryPendientes = `
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
      const rowsPendientes = await timed("q_pendientes_global", () =>
        executeQuery({ dbConnection: db, query: queryPendientes })
      );
      infoADevolver.pendings = rowsPendientes.length;

      // En Camino, Cerrados y Entregados HOY
      const queryHistorial = `
        SELECT 
          SUM(CASE WHEN estado IN (${estadosEnCamino}) THEN 1 ELSE 0 END) AS enCamino,
          SUM(CASE WHEN estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS cerradosHoy,
          SUM(CASE WHEN estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS entregadosHoy
        FROM envios_historial 
        WHERE elim = 0 
          AND superado = 0 
          AND DATE(fecha) = CURDATE()
      `;
      const rowsHistorial = await timed("q_historial_global_hoy", () =>
        executeQuery({ dbConnection: db, query: queryHistorial })
      );
      if (rowsHistorial && rowsHistorial.length > 0) {
        infoADevolver.onTheWay = parseInt(rowsHistorial[0].enCamino, 10) || 0;
        infoADevolver.closedToday = parseInt(rowsHistorial[0].cerradosHoy, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsHistorial[0].entregadosHoy, 10) || 0;
      }
      break;
    }

    case 2: {
      // Cerrados y Entregados HOY para caso 2
      const queryCerradosYEntregados = `
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
      const rowsCE = await timed("q_cerrados_entregados_caso2", () =>
        executeQuery({ dbConnection: db, query: queryCerradosYEntregados })
      );
      if (rowsCE && rowsCE.length > 0) {
        infoADevolver.closedToday = parseInt(rowsCE[0].closedToday, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsCE[0].deliveredToday, 10) || 0;
      }
      break;
    }

    case 3: {
      // ASIGNADOS HOY para operador
      const queryAsignadosHoy = `
        SELECT COUNT(id) AS total 
        FROM envios_asignaciones 
        WHERE operador = ${userId} 
          AND superado = 0 
          AND elim = 0 
          AND autofecha > '${date} 00:00:00'
      `;
      infoADevolver.assignedToday = await fetchCount(queryAsignadosHoy, "q_asignados_hoy_operador");

      // PENDIENTES para operador (últimos 7 días)
      const queryPendientes = `
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
      const rowsPendientesOperador = await timed("q_pendientes_operador", () =>
        executeQuery({ dbConnection: db, query: queryPendientes })
      );
      infoADevolver.pendings = rowsPendientesOperador.length;

      // En Camino, Cerrados y Entregados HOY para operador
      const queryHistorial = `
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
      const rowsHistorialOperador = await timed("q_historial_operador_hoy", () =>
        executeQuery({ dbConnection: db, query: queryHistorial })
      );
      if (rowsHistorialOperador && rowsHistorialOperador.length > 0) {
        infoADevolver.onTheWay = parseInt(rowsHistorialOperador[0].onTheWay, 10) || 0;
        infoADevolver.closedToday = parseInt(rowsHistorialOperador[0].closedToday, 10) || 0;
        infoADevolver.deliveredToday = parseInt(rowsHistorialOperador[0].deliveredToday, 10) || 0;
      }
      break;
    }

    default:
      // Manejar caso por defecto si es necesario
      break;
  }

  let startedRoute;

  if (req.user.profile == 3) {
    const sqlCadetesMovimientos = `
      SELECT tipo 
      FROM cadetes_movimientos 
      WHERE didCadete = ? 
        AND DATE(autofecha) = CURDATE() 
      ORDER BY id DESC 
      LIMIT 1
    `;

    const resultQueryCadetesMovimientos = await timed("q_cadetes_movimientos_hoy", () =>
      executeQuery({ dbConnection: db, query: sqlCadetesMovimientos, values: [userId] })
    );

    if (resultQueryCadetesMovimientos.length == 0) {
      startedRoute = false;
    } else {
      startedRoute = resultQueryCadetesMovimientos[0].tipo == 0;
    }
  }

  const totalMs = Number((performance.now() - tAllStart).toFixed(2));

  return {
    data: {
      homeData: infoADevolver,
      startedRoute,
      perf: {
        totalMs,
        steps: perfMarks,
      },
    },
    message: "Datos obtenidos correctamente",
  };
}
