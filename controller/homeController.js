import mysql2 from 'mysql';
import { getProdDbConfig, executeQuery, redisClient } from '../db.js';
import { logPurple, logRed, logYellow } from '../src/funciones/logsCustom.js';


export async function verifyStartedRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ? AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        const resultQueryCadetesMovimientos = await executeQuery(dbConnection, sqlCadetesMovimientos, [userId]);

        if (resultQueryCadetesMovimientos.length === 0) {
            return false;
        }

        return resultQueryCadetesMovimientos[0].tipo == 0;
    } catch (error) {
        logRed(`Error en verifyStartedRoute: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function startRoute(company, userId, dateYYYYMMDDHHSS, deviceFrom) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const hour = dateYYYYMMDDHHSS.split(' ')[1];
    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo) VALUES (?, ?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 0]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_inicioApp = ? WHERE superado=0 AND elim=0 AND didChofer = ?";
        await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);

        const dias = 3;

        const queryEnviosAsignadosHoy = "SELECT didEnvio, estado FROM envios_asignaciones WHERE superado=0 AND elim=0 AND operador=? AND DATE(autofecha) = CURDATE()";

        const envios = await executeQuery(dbConnection, queryEnviosAsignadosHoy, [userId, dias]);
        if (envios.length > 0) {
            const shipmentIds = envios
                .filter(e => e.estado !== 5 && e.estado !== 8 && e.estado !== 9 && e.didEnvio != null)
                .map(e => e.didEnvio);

            await fsetestadoMasivoDesde(dbConnection, shipmentIds, deviceFrom, dateYYYYMMDDHHSS);
        }
    } catch (error) {
        logRed(`Error en startRoute: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function fsetestadoMasivoDesde(connection, shipmentIds, deviceFrom, dateYYYYMMDDHHSS) {
    const onTheWayState = 2;
    const query1 = `
        UPDATE envios_historial
        SET superado = 1
        WHERE superado = 0 AND didEnvio IN(${shipmentIds.join(',')})
    `;
    await executeQuery(connection, query1);

    const query2 = `
        UPDATE envios
        SET estado_envio =?
        WHERE superado = 0 AND did IN(${shipmentIds.join(',')})
    `;
    await executeQuery(connection, query2, [onTheWayState]);

    const query3 = `
        INSERT INTO envios_historial (didEnvio, estado, quien, fecha, didCadete, desde)
        SELECT did, ?, 0, ?, 0, ?
        FROM envios WHERE did IN(${shipmentIds.join(',')})
    `;
    await executeQuery(connection, query3, [onTheWayState, dateYYYYMMDDHHSS, deviceFrom]);
}

export async function endRoute(company, userId, dateYYYYMMDD) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const hour = dateYYYYMMDD.split(' ')[1];

    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo) VALUES (?, ?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 1]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
        await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);
    } catch (error) {
        logRed(`Error en endRoute: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getHomeData(company, userId, profile, dateYYYYMMDD) {
    const dbConfig = getProdDbConfig(company);
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
                    AND eh.estado IN (${estadosPendientes})
                `;
                    const rowsPendientes = await executeQuery(dbConnection, queryPendientes, []);
                    infoADevolver.pendings = rowsPendientes.length;

                    // En Camino, Cerrados y Entregados HOY (fecha actual)
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
                    SUM(CASE WHEN eh.estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS cerradosHoy,
                    SUM(CASE WHEN eh.estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS entregadosHoy
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
                    AND eh.estado IN (${estadosPendientes})
                `;
                    const rowsPendientesOperador = await executeQuery(dbConnection, queryPendientes, []);
                    infoADevolver.pendings = rowsPendientesOperador.length;

                    // En Camino, Cerrados y Entregados HOY para operador
                    const queryHistorial = `
                  SELECT 
                    SUM(CASE WHEN estado IN (${estadosEnCamino}) THEN 1 ELSE 0 END) AS enCamino,
                    SUM(CASE WHEN estado IN (${estadosCerradosHoy}) THEN 1 ELSE 0 END) AS cerradosHoy,
                    SUM(CASE WHEN estado IN (${estadosEntregadosHoy}) THEN 1 ELSE 0 END) AS entregadosHoy
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
        throw error;
    } finally {
        dbConnection.end();
    }
}
