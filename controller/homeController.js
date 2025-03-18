import mysql from 'mysql';
import { getProdDbConfig, executeQuery, redisClient } from '../db.js';
import { logPurple, logRed, logYellow } from '../src/funciones/logsCustom.js';

export async function verifyStartedRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
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

export async function startRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const ahora = new Date().toLocaleTimeString('es-ES', { hour12: false }).slice(0, 5);
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo) VALUES (?, ?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 0]);

        const querySelectRuteo = "SELECT hs_inicioApp, tiempo FROM ruteo WHERE superado=0 AND elim=0 AND didChofer = ?";
        const rows = await executeQuery(dbConnection, querySelectRuteo, [userId]);

        if (rows.length > 0 && rows[0].tiempo) {
            const [hora, minutos] = ahora.split(':').map(Number);
            const totalSegundos = (hora * 3600) + (minutos * 60) + rows[0].tiempo;
            const nuevaHora = new Date(totalSegundos * 1000).toISOString().substr(11, 5);

            const sqlUpdateRuteo = "UPDATE ruteo SET hs_inicioApp = ?, hs_finApp = ? WHERE superado=0 AND elim=0 AND didChofer = ?";
            await executeQuery(dbConnection, sqlUpdateRuteo, [ahora, nuevaHora, userId]);
        } else {
            const sqlUpdateRuteo = "UPDATE ruteo SET hs_inicioApp = ? WHERE superado=0 AND elim=0 AND didChofer = ?";
            await executeQuery(dbConnection, sqlUpdateRuteo, [ahora, userId]);
        }

        const dias = 3;

        const queryEnviosAsignadosHoy = "SELECT didEnvio, estado FROM envios_asignaciones WHERE superado=0 AND elim=0 AND operador=? AND DATE(autofecha) = CURDATE()";

        const envios = await executeQuery(dbConnection, queryEnviosAsignadosHoy, [userId, dias]);
        if (envios.length > 0) {
            const didEnvios = envios
                .filter(e => e.estado !== 5 && e.estado !== 8 && e.estado !== 9 && e.didEnvio != null)
                .map(e => e.didEnvio);

            await fsetestadoMasivoDesde(2, didEnvios, "APP Comenzar", dbConnection);
        }
    } catch (error) {
        logRed(`Error en startRoute: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function fsetestadoMasivoDesde(estado, envios, desde, connection) {
    const fecha = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const query1 = `
        UPDATE envios_historial
        SET superado = 1
        WHERE superado = 0 AND didEnvio IN(${envios.join(',')})
    `;
    await executeQuery(connection, query1);

    const query2 = `
        UPDATE envios
        SET estado_envio =?
        WHERE superado = 0 AND did IN(${envios.join(',')})
    `;
    await executeQuery(connection, query2, [estado]);

    const query3 = `
        INSERT INTO envios_historial (didEnvio, estado, quien, fecha, didCadete, desde)
        SELECT did, ?, 0, ?, 0, ?
        FROM envios WHERE did IN(${envios.join(',')})
    `;
    await executeQuery(connection, query3, [estado, fecha, desde]);
}

export async function endRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo) VALUES (?, ?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 1]);

        const ahora = new Date().toLocaleTimeString('es-ES', { hour12: false }).slice(0, 5);
        const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
        await executeQuery(dbConnection, sqlUpdateRuteo, [ahora, userId]);
    } catch (error) {
        logRed(`Error en endRoute: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getHomeData(company, userId, profile) {

    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const hoy = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD

        const lineas = await executeQuery(dbConnection, "SELECT envios, envios_historial FROM tablas_indices WHERE fecha = DATE_SUB(?, INTERVAL 7 DAY) ORDER BY id DESC", [hoy]);
        let lineaEnvios;
        let lineaEnviosHistorial;
console.log(lineas, "lineas"
);

console.log(hoy, "hoy");

        if (lineas == undefined) {



            lineaEnvios = 0;
            lineaEnviosHistorial = 0;
        }
        else {


            let le = lineas.slice(-1);
            console.log(le, "le");
            

            lineaEnvios = le[0].envios;
            lineaEnviosHistorial = le[0].envios_historial;

        }

        // Definir estados según el didEmpresa
        const estadosPendientes = {
            20: '(0, 1, 2, 3, 6, 7, 10, 11, 12)',
            55: '(0, 1, 2, 3, 6, 7, 10, 11, 12)',
            72: '(0, 1, 2, 3, 6, 7, 10, 11, 12, 16, 18, 16)',
            default: '(0, 1, 2, 3, 6, 7, 10, 11, 12)'
        }[company] || '(0, 1, 2, 3, 6, 7, 10, 11, 12)';

        const estadosEnCamino = {
            20: '(2, 11, 12, 16)',
            55: '(2, 11, 12)',
            72: '(2, 11, 12)',
            default: '(2, 11, 12)'
        }[company] || '(2, 11, 12)';

        const estadosCerradosHoy = {
            20: '(5, 8, 9, 14, 17)',
            55: '(5, 8, 9, 14, 16)',
            72: '(5, 8, 9, 14)',
            default: '(5, 8, 9, 14)',
        }[company] || '(5, 8, 9, 14)';

        const estadosEntregadosHoy = {
            20: '(5, 9, 17)',
            55: '(5, 9, 16)',
            72: '(5, 9)',
            default: '(5, 9)'
        }[company] || '(5, 9)';

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

            case 5:
                // ASIGNADOS HOY
                const asignadosHoyResult = await executeQuery(dbConnection, "SELECT COUNT(id) AS total FROM envios_asignaciones WHERE superado = 0 AND elim = 0 AND autofecha > ?", [`${hoy} 00:00:00`]);
                infoADevolver.assignedToday = asignadosHoyResult[0]?.total || 0;

                // PENDIENTES Y EN CAMINO
                const pendientesYEnCaminoResult = await executeQuery(dbConnection, `
                    SELECT
                        SUM(CASE WHEN eh.estado IN ${estadosPendientes} THEN 1 ELSE 0 END) AS pendientes,
                        SUM(CASE WHEN eh.estado IN ${estadosEnCamino} THEN 1 ELSE 0 END) AS enCamino
                    FROM envios_historial AS eh
                    LEFT JOIN envios AS e ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did)
                    WHERE eh.id > ? AND eh.superado = 0 AND eh.elim = 0 AND e.elim = 0 AND e.superado = 0 AND e.didCliente != 0
                `, [lineaEnviosHistorial]);



                infoADevolver.pendings = pendientesYEnCaminoResult[0]?.pendientes || 0;
                infoADevolver.onTheWay = pendientesYEnCaminoResult[0]?.onTheWay || 0;

                // CERRADOS Y ENTREGADOS HOY
                const cerradosYEntregadosHoyResult = await executeQuery(dbConnection, `
                    SELECT
                        SUM(CASE WHEN estado IN ${estadosCerradosHoy} THEN 1 ELSE 0 END) AS cerradosHoy,
                        SUM(CASE WHEN estado IN ${estadosEntregadosHoy} THEN 1 ELSE 0 END) AS entregadosHoy
                    FROM envios_historial
                    WHERE autofecha > ? AND superado = 0 AND elim = 0
                `, [`${hoy} 00:00:00`]);

                infoADevolver.closedToday = cerradosYEntregadosHoyResult[0]?.closedToday || 0;
                infoADevolver.deliveredToday = cerradosYEntregadosHoyResult[0]?.deliveredToday || 0;
                break;

            case 2:
                // CERRADOS Y ENTREGADOS HOY
                const cerradosHoyYEntregadosHoyResult = await executeQuery(dbConnection, `
                    SELECT
                        SUM(CASE WHEN eh.estado IN ${estadosCerradosHoy} THEN 1 ELSE 0 END) AS cerradosHoy,
                        SUM(CASE WHEN eh.estado IN ${estadosEntregadosHoy} THEN 1 ELSE 0 END) AS entregadosHoy
                    FROM envios_historial AS eh
                    LEFT JOIN envios AS e ON (e.did = eh.didEnvio AND e.superado = 0 AND e.elim = 0)
                    WHERE eh.autofecha > ? AND eh.superado = 0 AND eh.elim = 0 AND e.didCliente = ?
                `, [`${hoy} 00:00:00`, userId]);

                infoADevolver.closedToday = cerradosHoyYEntregadosHoyResult[0]?.closedToday || 0;
                infoADevolver.deliveredToday = cerradosHoyYEntregadosHoyResult[0]?.deliveredToday || 0;
                break;

            case 3:


                // ASIGNADOS HOY
                const asignadosHoyCase3Result = await executeQuery(dbConnection, "SELECT COUNT(id) AS total FROM envios_asignaciones WHERE operador = ? AND superado = 0 AND elim = 0 AND autofecha > ?", [userId, `${hoy} 00:00:00`]);


                infoADevolver.assignedToday = asignadosHoyCase3Result[0].total || 0;



                // PENDIENTES Y EN CAMINO
                const pendientesYEnCaminoCase3Result = await executeQuery(dbConnection, `
                    SELECT
                        SUM(CASE WHEN estado_envio IN ${estadosPendientes} THEN 1 ELSE 0 END) AS pendientes,
                        SUM(CASE WHEN estado_envio IN ${estadosEnCamino} THEN 1 ELSE 0 END) AS enCamino
                    FROM envios
                    WHERE id > ? AND superado = 0 AND elim = 0 AND choferAsignado = ?
                `, [lineaEnvios, userId]);




                infoADevolver.pendings = pendientesYEnCaminoCase3Result[0].pendientes || 0;
                infoADevolver.onTheWay = pendientesYEnCaminoCase3Result[0].enCamino || 0;

                // CERRADOS Y ENTREGADOS HOY
                const cerradosHoyYEntregadosHoyCase3Result = await executeQuery(dbConnection, `
                    SELECT
                        SUM(CASE WHEN estado IN ${estadosCerradosHoy} THEN 1 ELSE 0 END) AS cerradosHoy,
                        SUM(CASE WHEN estado IN ${estadosEntregadosHoy} THEN 1 ELSE 0 END) AS entregadosHoy
                    FROM envios_historial
                    WHERE autofecha > ? AND superado = 0 AND elim = 0 AND didCadete = ?
                `, [`${hoy} 00:00:00`, userId]);


                infoADevolver.closedToday = cerradosHoyYEntregadosHoyCase3Result[0]?.cerradosHoy || 0;
                infoADevolver.deliveredToday = cerradosHoyYEntregadosHoyCase3Result[0]?.entregadosHoy || 0;
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
