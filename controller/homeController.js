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

        // Consultas según el perfil
        switch (profile) {
            case 1:
                // ASIGNADOS HOY
                {
                    const queryAssignedToday = `
                  SELECT COUNT(id) AS total 
                  FROM envios_asignaciones 
                  WHERE superado = 0 
                    AND elim = 0 
                    AND autofecha > ?
                `;
                    const assignedTodayResult = await executeQuery(dbConnection, queryAssignedToday, [`${dateYYYYMMDD} 00:00:00`], true);
                    infoADevolver.assignedToday = assignedTodayResult[0]?.total || 0;
                }

                // PENDIENTES: desde hace 7 días hasta hoy
                {
                    const queryPendings = `
                  SELECT SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS pendings 
                  FROM envios_historial 
                  WHERE elim = 0 
                    AND superado = 0 
                    AND DATE(fecha) BETWEEN DATE_SUB(?, INTERVAL 7 DAY) AND ?
                `;
                    const pendingsResult = await executeQuery(dbConnection, queryPendings, [estadosPendientes, dateYYYYMMDD, dateYYYYMMDD]);

                    infoADevolver.pendings = pendingsResult[0]?.pendings || 0;
                }

                // En Camino, Cerrados y Entregados HOY (sólo para la fecha actual)
                {
                    const queryHistorial = `
                  SELECT 
                    SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS onTheWay,
                    SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS closedToday,
                    SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS deliveredToday
                  FROM envios_historial 
                  WHERE elim = 0 
                    AND superado = 0 
                    AND DATE(fecha) = CURDATE()
                `;
                    const historialResult = await executeQuery(dbConnection, queryHistorial, [estadosEnCamino, estadosCerradosHoy, estadosEntregadosHoy]);
                    infoADevolver.onTheWay = historialResult[0]?.onTheWay || 0;
                    infoADevolver.closedToday = historialResult[0]?.closedToday || 0;
                    infoADevolver.deliveredToday = historialResult[0]?.deliveredToday || 0;
                }
                break;

            case 2:
                // Cerrados y Entregados HOY
                {
                    const queryClosedDelivered = `
                  SELECT
                    SUM(CASE WHEN eh.estado IN (?) THEN 1 ELSE 0 END) AS closedToday,
                    SUM(CASE WHEN eh.estado IN (?) THEN 1 ELSE 0 END) AS deliveredToday
                  FROM envios_historial AS eh
                  LEFT JOIN envios AS e 
                    ON (e.did = eh.didEnvio AND e.superado = 0 AND e.elim = 0)
                  LEFT JOIN sistema_usuarios_accesos AS sua 
                    ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ?)
                  WHERE DATE(eh.fecha) = CURDATE()
                    AND eh.superado = 0
                    AND eh.elim = 0
                    AND e.didCliente = sua.codigo_empleado
                `;
                    const closedDeliveredResult = await executeQuery(dbConnection, queryClosedDelivered, [estadosCerradosHoy, estadosEntregadosHoy, userId]);
                    infoADevolver.closedToday = closedDeliveredResult[0]?.closedToday || 0;
                    infoADevolver.deliveredToday = closedDeliveredResult[0]?.deliveredToday || 0;
                }
                break;

            case 3:
                // ASIGNADOS HOY para operador
                {
                    const queryAssignedTodayCase3 = `
                  SELECT COUNT(id) AS total 
                  FROM envios_asignaciones 
                  WHERE operador = ? 
                    AND superado = 0 
                    AND elim = 0 
                    AND autofecha > ?
                `;
                    const assignedTodayCase3Result = await executeQuery(dbConnection, queryAssignedTodayCase3, [userId, `${dateYYYYMMDD} 00:00:00`]);
                    infoADevolver.assignedToday = assignedTodayCase3Result[0]?.total || 0;
                }

                // PENDIENTES y EN CAMINO para el operador
                {
                    const queryPendingsOnTheWayCase3 = `
                  SELECT
                    SUM(CASE WHEN estado_envio IN (?) THEN 1 ELSE 0 END) AS pendings,
                    SUM(CASE WHEN estado_envio IN (?) THEN 1 ELSE 0 END) AS onTheWay
                  FROM envios
                  WHERE superado = 0
                    AND elim = 0
                    AND choferAsignado = ?
                    AND DATE(fecha_inicio) BETWEEN DATE_SUB(?, INTERVAL 7 DAY) AND ?
                `;
                    const pendingsOnTheWayCase3Result = await executeQuery(dbConnection, queryPendingsOnTheWayCase3, [
                        estadosPendientes,
                        estadosEnCamino,
                        userId,
                        dateYYYYMMDD,
                        dateYYYYMMDD,
                    ]);
                    infoADevolver.pendings = pendingsOnTheWayCase3Result[0]?.pendings || 0;
                    infoADevolver.onTheWay = pendingsOnTheWayCase3Result[0]?.onTheWay || 0;
                }

                // CERRADOS y ENTREGADOS HOY para el operador
                {
                    const queryClosedDeliveredCase3 = `
                  SELECT
                    COUNT(IF(estado IN (?) , 1, NULL)) AS closedToday,
                    COUNT(IF(estado IN (?) , 1, NULL)) AS deliveredToday
                  FROM envios_historial
                  WHERE DATE(fecha) = CURDATE()
                    AND superado = 0
                    AND elim = 0
                    AND didCadete = ?
                `;
                    const closedDeliveredCase3Result = await executeQuery(dbConnection, queryClosedDeliveredCase3, [
                        estadosCerradosHoy,
                        estadosEntregadosHoy,
                        userId
                    ]);
                    infoADevolver.closedToday = closedDeliveredCase3Result[0]?.closedToday || 0;
                    infoADevolver.deliveredToday = closedDeliveredCase3Result[0]?.deliveredToday || 0;
                }
                break;

            case 5:
                // ASIGNADOS HOY
                {
                    const queryAssignedTodayCase5 = `
                  SELECT COUNT(id) AS total 
                  FROM envios_asignaciones 
                  WHERE superado = 0 
                    AND elim = 0 
                    AND autofecha > ?
                `;
                    const assignedTodayCase5Result = await executeQuery(dbConnection, queryAssignedTodayCase5, [`${dateYYYYMMDD} 00:00:00`]);
                    infoADevolver.assignedToday = assignedTodayCase5Result[0]?.total || 0;
                }

                // PENDIENTES y EN CAMINO en los últimos 7 días
                {
                    const queryPendingsOnTheWayCase5 = `
                  SELECT 
                    COUNT(DISTINCT IF(e.estado_envio IN (?) , e.did, NULL)) AS pendings,
                    COUNT(DISTINCT IF(e.estado_envio IN (?) , e.did, NULL)) AS onTheWay
                  FROM envios AS e
                  WHERE e.superado = 0
                    AND e.elim = 0
                    AND DATE(e.fecha_inicio) BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
                `;
                    const pendingsOnTheWayCase5Result = await executeQuery(dbConnection, queryPendingsOnTheWayCase5, [estadosPendientes, estadosEnCamino]);
                    infoADevolver.pendings = pendingsOnTheWayCase5Result[0]?.pendings || 0;
                    infoADevolver.onTheWay = pendingsOnTheWayCase5Result[0]?.onTheWay || 0;
                }

                // CERRADOS y ENTREGADOS HOY
                {
                    const queryClosedDeliveredCase5 = `
                  SELECT
                    SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS closedToday,
                    SUM(CASE WHEN estado IN (?) THEN 1 ELSE 0 END) AS deliveredToday
                  FROM envios_historial
                  WHERE DATE(fecha) = CURDATE()
                    AND superado = 0
                    AND elim = 0
                `;
                    const closedDeliveredCase5Result = await executeQuery(dbConnection, queryClosedDeliveredCase5, [estadosCerradosHoy, estadosEntregadosHoy]);
                    infoADevolver.closedToday = closedDeliveredCase5Result[0]?.closedToday || 0;
                    infoADevolver.deliveredToday = closedDeliveredCase5Result[0]?.deliveredToday || 0;
                }
                break;

            default:
                throw new Error("Perfil no reconocido");
        }


        // Cerrar conexión
        return infoADevolver;

    } catch (error) {
        logRed(`Error en getHomeData: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}
