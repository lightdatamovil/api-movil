import mysql2 from 'mysql2';
import { executeQuery, getProdDbConfig } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

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

            await fsetestadoMasivoDesde(dbConnection, shipmentIds, deviceFrom, dateYYYYMMDDHHSS, userId);
        }
    } catch (error) {
        logRed(`Error en startRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error iniciando ruta',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}

async function fsetestadoMasivoDesde(connection, shipmentIds, deviceFrom, dateYYYYMMDDHHSS, userId) {
    try {
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
            SELECT did, ?, quien, ?, choferAsignado, ?
            FROM envios WHERE did IN(${shipmentIds.join(',')})
        `;
        await executeQuery(connection, query3, [onTheWayState, dateYYYYMMDDHHSS, userId, deviceFrom]);
    } catch (error) {
        throw error;
    }

}