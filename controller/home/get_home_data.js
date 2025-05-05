import { getDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getHomeData(company, userId, profile, dateYYYYMMDD) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        // --- 1) Defino y convierto a strings todas las listas de estados
        let estadosPendientes = {
            20: '(0,1,2,3,6,7,10,11,12,13)',
            55: '(0,1,2,3,6,7,10,11,12,13)',
            72: '(0,1,2,3,6,7,10,11,12,13,16,18)',
            default: '(0,1,2,3,6,7,10,11,12)'
        }[company.did] || '(0,1,2,3,6,7,10,11,12)';

        let estadosEnCamino = {
            20: '(2,11,12,16)',
            55: '(2,11,12)',
            72: '(2,11,12)',
            default: '(2,11,12)'
        }[company.did] || '(2,11,12)';

        let estadosCerradosHoy = {
            20: '(5,8,9,14,17)',
            55: '(5,8,9,14,16)',
            72: '(5,8,9,14)',
            default: '(5,8,9,14)'
        }[company.did] || '(5,8,9,14)';

        let estadosEntregadosHoy = {
            20: '(5,9,17)',
            55: '(5,9,16)',
            72: '(5,9)',
            default: '(5,9)'
        }[company.did] || '(5,9)';

        const infoADevolver = {
            assignedToday: 0,
            pendings: 0,
            onTheWay: 0,
            closedToday: 0,
            deliveredToday: 0
        };

        switch (profile) {
            case 1:
            case 5:
                const queryUnificada = `
                    SELECT
                      SUM(CASE WHEN asignacionFecha > '${dateYYYYMMDD} 00:00:00' THEN 1 ELSE 0 END) AS assignedToday,
                      SUM(CASE WHEN fechaHistorial BETWEEN DATE_SUB('${dateYYYYMMDD}', INTERVAL 7 DAY)
                            AND '${dateYYYYMMDD} 23:59:59' AND estado IN ${estadosPendientes}
                           THEN 1 ELSE 0 END) AS pendings,
                      SUM(CASE WHEN DATE(fechaHistorial)=CURDATE() AND estado IN ${estadosEnCamino}
                           THEN 1 ELSE 0 END) AS onTheWay,
                      SUM(CASE WHEN DATE(fechaHistorial)=CURDATE() AND estado IN ${estadosCerradosHoy}
                           THEN 1 ELSE 0 END) AS closedToday,
                      SUM(CASE WHEN DATE(fechaHistorial)=CURDATE() AND estado IN ${estadosEntregadosHoy}
                           THEN 1 ELSE 0 END) AS deliveredToday
                    FROM envios
                    WHERE elim = 0
                      AND superado = 0
                `;
                {
                    const [row] = await executeQuery(dbConnection, queryUnificada, [], true);
                    infoADevolver.assignedToday = parseInt(row.assignedToday, 10) || 0;
                    infoADevolver.pendings = parseInt(row.pendings, 10) || 0;
                    infoADevolver.onTheWay = parseInt(row.onTheWay, 10) || 0;
                    infoADevolver.closedToday = parseInt(row.closedToday, 10) || 0;
                    infoADevolver.deliveredToday = parseInt(row.deliveredToday, 10) || 0;
                }
                break;

            case 2:
                {
                    const query2 = `
                    SELECT
                      SUM(CASE WHEN eh.estado IN ${estadosCerradosHoy} THEN 1 ELSE 0 END) AS closedToday,
                      SUM(CASE WHEN eh.estado IN ${estadosEntregadosHoy} THEN 1 ELSE 0 END) AS deliveredToday
                    FROM envios_historial AS eh
                    LEFT JOIN envios AS e 
                      ON (e.did = eh.didEnvio AND e.superado = 0 AND e.elim = 0)
                    LEFT JOIN sistema_usuarios_accesos AS sua 
                      ON (sua.usuario = ${userId} AND sua.superado = 0 AND sua.elim = 0)
                    WHERE DATE(eh.fecha) = CURDATE()
                      AND eh.superado = 0
                      AND eh.elim = 0
                      AND e.elim = 0
                      AND e.superado = 0
                      AND sua.codigo_empleado = e.didCliente
                  `;
                    const [row] = await executeQuery(dbConnection, query2, [], true);
                    infoADevolver.closedToday = parseInt(row.closedToday, 10) || 0;
                    infoADevolver.deliveredToday = parseInt(row.deliveredToday, 10) || 0;
                }
                break;

            case 3:
                {
                    const query3 = `
                    SELECT
                      SUM(CASE WHEN ea.operador = ${userId}
                                   AND ea.autofecha > '${dateYYYYMMDD} 00:00:00'
                               THEN 1 ELSE 0 END) AS assignedToday,

                      SUM(CASE WHEN eh.didCadete = ${userId}
                                   AND fechaHistorial BETWEEN DATE_SUB('${dateYYYYMMDD}', INTERVAL 7 DAY)
                                                          AND '${dateYYYYMMDD} 23:59:59'
                                   AND eh.estado IN ${estadosPendientes}
                               THEN 1 ELSE 0 END) AS pendings,

                      SUM(CASE WHEN eh.didCadete = ${userId}
                                   AND DATE(fechaHistorial) = CURDATE()
                                   AND eh.estado IN ${estadosEnCamino}
                               THEN 1 ELSE 0 END) AS onTheWay,

                      SUM(CASE WHEN eh.didCadete = ${userId}
                                   AND DATE(fechaHistorial) = CURDATE()
                                   AND eh.estado IN ${estadosCerradosHoy}
                               THEN 1 ELSE 0 END) AS closedToday,

                      SUM(CASE WHEN eh.didCadete = ${userId}
                                   AND DATE(fechaHistorial) = CURDATE()
                                   AND eh.estado IN ${estadosEntregadosHoy}
                               THEN 1 ELSE 0 END) AS deliveredToday

                    FROM envios_asignaciones AS ea
                    LEFT JOIN envios_historial AS eh 
                      ON eh.didEnvio = ea.didEnvio
                    WHERE ea.operador = ${userId}
                      AND ea.superado = 0
                      AND ea.elim    = 0
                      AND eh.superado = 0
                      AND eh.elim     = 0
                  `;
                    const [row] = await executeQuery(dbConnection, query3, [], true);
                    infoADevolver.assignedToday = parseInt(row.assignedToday, 10) || 0;
                    infoADevolver.pendings = parseInt(row.pendings, 10) || 0;
                    infoADevolver.onTheWay = parseInt(row.onTheWay, 10) || 0;
                    infoADevolver.closedToday = parseInt(row.closedToday, 10) || 0;
                    infoADevolver.deliveredToday = parseInt(row.deliveredToday, 10) || 0;
                }
                break;

            default:
                break;
        }

        return infoADevolver;

    } catch (error) {
        logRed(`Error en getHomeData: ${error.stack}`);
        if (error instanceof CustomException) throw error;
        throw new CustomException({
            title: 'Error obteniendo datos de inicio',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}
