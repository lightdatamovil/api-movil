import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../db.js';

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
        console.error("Error en verifyStartedRoute:", error);
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

        const queryEnviosAsignadosHoy = "SELECT didEnvio FROM envios_asignaciones WHERE superado=0 AND elim=0 AND operador=? AND DATE(autofecha) = CURDATE()";

        const envios = await executeQuery(dbConnection, queryEnviosAsignadosHoy, [userId, dias]);
        if (envios.length > 0) {
            const didEnvios = envios.map(e => e.didEnvio);
            await fsetestadoMasivoDesde(2, didEnvios, "APP Comenzar", dbConnection);
        }
    } catch (error) {
        console.error("Error en startRoute:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function fsetestadoMasivoDesde(estado, envios, desde, connection) {
    const fecha = new Date().toISOString().replace('T', ' ').substr(0, 19);
    await executeQuery(connection, `
        UPDATE envios_historial
        SET superado=1
        WHERE superado=0 AND didEnvio IN (${envios.join(',')})
    `);
    await executeQuery(connection, `
        UPDATE envios
        SET estado_envio=?
        WHERE superado=0 AND did IN (${envios.join(',')})
    `, [estado]);
    await executeQuery(connection, `
        INSERT INTO envios_historial (didEnvio, estado, quien, fecha, didCadete, desde)
        SELECT did, ?, 0, ?, 0, ? FROM envios WHERE did IN (${envios.join(',')})
    `, [estado, fecha, desde]);
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
        console.error("Error en endRoute:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getHomeData(company, userId, profile) {
    // GUILLE
    return null;
}

