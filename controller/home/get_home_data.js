import { executeQuery } from "../../db.js";
import mysql2 from 'mysql2';
import { logRed } from "../../src/funciones/logsCustom.js";


export async function getHomeData(company, userId, profile, dateYYYYMMDD) {
    const dbConfig = getDbProdConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const estadosPendientes = {
            20: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13],
            55: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13],
            72: [0, 1, 2, 3, 6, 7, 10, 11, 12, 13, 16, 18, 16],
            default: [0, 1, 2, 3, 6, 7, 10, 11, 12]
        }[company] || [0, 1, 2, 3, 6, 7, 10, 11, 12, 13];

        const estadosEnCamino = {
            20: [2, 11, 12, 16],
            55: [2, 11, 12],
            72: [2, 11, 12],
            default: [2, 11, 12]
        }[company] || [2, 11, 12];

        const estadosCerradosHoy = {
            20: [5, 8, 9, 14, 17],
            55: [5, 8, 9, 14, 16],
            72: [5, 8, 9, 14],
            default: [5, 8, 9, 14],
        }[company] || [5, 8, 9, 14];

        const estadosEntregadosHoy = {
            20: [5, 9, 17],
            55: [5, 9, 16],
            72: [5, 9],
            default: [5, 9]
        }[company] || [5, 9];

        const infoADevolver = {
            assignedToday: 0,
            pendings: 0,
            onTheWay: 0,
            closedToday: 0,
            deliveredToday: 0
        };
        async function fetchCount(query) {
            const rows = await executeQuery(dbConnection, query, []);
            return rows && rows.length ? parseInt(rows[0].total, 10) : 0;
        }

        switch (profile) {
            case 1:
            case 5:
                {
                    // ASIGNADOS HOY: Contar registros en envios_asignaciones con autofecha mayor a "$hoy 00:00:00"
                    const queryAsignadosHoy = `
                  SELECT COUNT(id) AS total 
                  FROM envios_asignaciones 
                  WHERE superado = 0 
                    AND elim = 0 
                    AND autofecha > '${dateYYYYMMDD} 00:00:00'
                `;
                    infoADevolver.assignedToday = await fetchCount(queryAsignadosHoy);

                    // PENDIENTES: Registros de envios_historial (con LEFT JOIN a envios) en los últimos 7 días
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
                    AND DATE(eh.fecha) BETWEEN DATE_SUB('${dateYYYYMMDD}', INTERVAL 7 DAY) AND '${dateYYYYMMDD}'
                    AND eh.estado IN (${estadosPendientes[company.did]})
                `;
                    const rowsPendientes = await executeQuery(dbConnection, queryPendientes, []);
                    infoADevolver.pendings = rowsPendientes.length;

                    // En Camino, Cerrados y Entregados HOY (fecha actual)
                    const queryHistorial = `
                  SELECT 
                    SUM(CASE WHEN estado IN (${estadosEnCamino[company.did]}) THEN 1 ELSE 0 END) AS enCamino,
                    SUM(CASE WHEN estado IN (${estadosCerradosHoy[company.did]}) THEN 1 ELSE 0 END) AS cerradosHoy,
                    SUM(CASE WHEN estado IN (${estadosEntregadosHoy[company.did]}) THEN 1 ELSE 0 END) AS entregadosHoy
                  FROM envios_historial 
                  WHERE elim = 0 
                    AND superado = 0 
                    AND DATE(fecha) = CURDATE()
                `;
                    const rowsHistorial = await executeQuery(dbConnection, queryHistorial, []);
                    if (rowsHistorial && rowsHistorial.length > 0) {
                        infoADevolver.onTheWay = parseInt(rowsHistorial[0].enCamino, 10) || 0;
                        infoADevolver.closedToday = parseInt(rowsHistorial[0].cerradosHoy, 10) || 0;
                        infoADevolver.deliveredToday = parseInt(rowsHistorial[0].entregadosHoy, 10) || 0;
                    }
                }
                break;

            case 2:
                {
                    // Cerrados y Entregados HOY para caso 2
                    const queryCerradosYEntregados = `
                  SELECT
                    SUM(CASE WHEN eh.estado IN (${estadosCerradosHoy[company.did]}) THEN 1 ELSE 0 END) AS cerradosHoy,
                    SUM(CASE WHEN eh.estado IN (${estadosEntregadosHoy[company.did]}) THEN 1 ELSE 0 END) AS entregadosHoy
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
                    const rowsCE = await executeQuery(dbConnection, queryCerradosYEntregados, []);
                    if (rowsCE && rowsCE.length > 0) {
                        infoADevolver.closedToday = parseInt(rowsCE[0].cerradosHoy, 10) || 0;
                        infoADevolver.deliveredToday = parseInt(rowsCE[0].entregadosHoy, 10) || 0;
                    }
                }
                break;

            case 3:
                {
                    // ASIGNADOS HOY para operador: filtrar por operador = didUsuario
                    const queryAsignadosHoy = `
                  SELECT COUNT(id) AS total 
                  FROM envios_asignaciones 
                  WHERE operador = ${userId} 
                    AND superado = 0 
                    AND elim = 0 
                    AND autofecha > '${dateYYYYMMDD} 00:00:00'
                `;
                    infoADevolver.assignedToday = await fetchCount(queryAsignadosHoy);

                    // PENDIENTES para operador (filtrado por didCadete)
                    const queryPendientes = `
                  SELECT didEnvio
                  FROM envios_historial AS eh
                  LEFT JOIN envios AS e ON (
                    e.superado = 0
                    AND e.elim = 0
                    AND e.did = eh.didEnvio
                  )
                  WHERE e.elim = 0
                    AND eh.didCadete = ${userId}
                    AND eh.elim = 0
                    AND eh.superado = 0
                    AND DATE(eh.fecha) BETWEEN DATE_SUB('${dateYYYYMMDD}', INTERVAL 7 DAY) AND '${dateYYYYMMDD}'
                    AND eh.estado IN (${estadosPendientes[company.did]})
                `;
                    const rowsPendientesOperador = await executeQuery(dbConnection, queryPendientes, []);
                    infoADevolver.pendings = rowsPendientesOperador.length;

                    // En Camino, Cerrados y Entregados HOY para operador
                    const queryHistorial = `
                  SELECT 
                    SUM(CASE WHEN estado IN (${estadosEnCamino[company.did]}) THEN 1 ELSE 0 END) AS enCamino,
                    SUM(CASE WHEN estado IN (${estadosCerradosHoy[company.did]}) THEN 1 ELSE 0 END) AS cerradosHoy,
                    SUM(CASE WHEN estado IN (${estadosEntregadosHoy[company.did]}) THEN 1 ELSE 0 END) AS entregadosHoy
                  FROM envios_historial 
                  WHERE elim = 0 
                    AND superado = 0 
                    AND didCadete = ${userId}
                    AND DATE(fecha) = CURDATE()
                `;
                    const rowsHistorialOperador = await executeQuery(dbConnection, queryHistorial, []);
                    if (rowsHistorialOperador && rowsHistorialOperador.length > 0) {
                        infoADevolver.onTheWay = parseInt(rowsHistorialOperador[0].onTheWay, 10) || 0;
                        infoADevolver.closedToday = parseInt(rowsHistorialOperador[0].closedToday, 10) || 0;
                        infoADevolver.deliveredToday = parseInt(rowsHistorialOperador[0].deliveredToday, 10) || 0;
                    }
                }
                break;

            default:
                // Manejar caso por defecto si es necesario
                break;
        }

        return infoADevolver;

    } catch (error) {
        logRed(`Error en getHomeData: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo datos de inicio',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}
