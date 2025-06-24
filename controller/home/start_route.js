import mysql2 from 'mysql2';
import { connectionsPools, executeQuery, executeQueryFromPool, getProdDbConfig } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function startRoute(company, userId, dateYYYYMMDDHHSS, deviceFrom) {
    const pool = connectionsPools[company.did];

    const hour = dateYYYYMMDDHHSS.split(' ')[1];
    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo,desde) VALUES (?, ?,?)";
        await executeQueryFromPool(pool, sqlInsertMovimiento, [userId, 0, 3]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_inicioApp = ? WHERE superado=0 AND elim=0 AND didChofer = ?";
        await executeQueryFromPool(pool, sqlUpdateRuteo, [hour, userId]);

        const dias = 3;

        const queryEnviosAsignadosHoy = `
            SELECT didEnvio, estado
            FROM envios_asignaciones
            WHERE superado=0
            AND elim=0
            AND operador=?
            AND estado NOT IN (5, 8, 9)
            AND didEnvio IS NOT NULL
            AND DATE(autofecha) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND CURDATE()
        `;
        let shipmentIds = [];

        const envios = await executeQueryFromPool(pool, queryEnviosAsignadosHoy, [userId, dias]);

        if (envios.length > 0) {
            shipmentIds = envios.map(envio => envio.didEnvio); const q = `SELECT did, estado_envio FROM envios WHERE superado=0 and elim=0 and estado_envio not in (?) and did in (?)`;
            const enviosPendientes = await executeQueryFromPool(pool, q, [[5, 7, 8, 9, 14], shipmentIds]);

            let enCaminoIds = enviosPendientes
                .filter(e => e.estado_envio == 2)
                .map(e => e.did);

            let pendientesIds = enviosPendientes
                .filter(e => e.estado_envio != 2)
                .map(e => e.did);



            if ((company.did == 22 || company.did == 20) && enCaminoIds.length > 0) {
                await fsetestadoMasivoDesde(pool, enCaminoIds, deviceFrom, dateYYYYMMDDHHSS, userId, 11);
            }
            if (pendientesIds.length > 0) {
                await fsetestadoMasivoDesde(pool, pendientesIds, deviceFrom, dateYYYYMMDDHHSS, userId, 2);
            }
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
    }
}

async function fsetestadoMasivoDesde(pool, shipmentIds, deviceFrom, dateYYYYMMDDHHSS, userId, onTheWayState) {
    try {
        const query1 = `
            UPDATE envios_historial
            SET superado = 1
            WHERE superado = 0 AND didEnvio IN(${shipmentIds.join(',')})
        `;
        await executeQueryFromPool(pool, query1);

        const query2 = `
            UPDATE envios
            SET estado_envio = ?
            WHERE superado = 0 AND did IN(${shipmentIds.join(',')})
        `;
        await executeQueryFromPool(pool, query2, [onTheWayState]);

        const query3 = `
            INSERT INTO envios_historial (didEnvio, estado, quien, fecha, didCadete, desde)
            SELECT did, ?, ?, ?, choferAsignado, ?
            FROM envios WHERE did IN(${shipmentIds.join(',')})
        `;
        await executeQueryFromPool(pool, query3, [onTheWayState, userId, dateYYYYMMDDHHSS, deviceFrom]);
    } catch (error) {
        throw error;
    }

}