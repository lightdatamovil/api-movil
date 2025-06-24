import mysql2 from 'mysql2';

import { getProdDbConfig, executeQuery, executeQueryFromPool, connectionsPools } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function saveRoute(company, userId, dateYYYYMMDD, orders, distance, totalDelay, additionalRouteData) {
    const pool = connectionsPools[company.did];

    try {
        let routeId = 0;

        const rows = await executeQueryFromPool(pool, "SELECT did FROM `ruteo` WHERE superado = 0 AND elim = 0 AND didChofer = ?", [userId]);
        if (rows.length > 0) {
            routeId = rows[0].did;
        }

        if (routeId !== 0) {
            await executeQueryFromPool(pool, "UPDATE `ruteo` SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?", [routeId]);
            // TODO: Verificar si es necesario actualizar las paradas
            // await executeQuery(dbConnection, "UPDATE `ruteo_paradas` SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuteo = ?", [routeId]);
        }

        // TODO: Que significa este 2??
        const result = await executeQueryFromPool(
            pool,
            "INSERT INTO ruteo (desde, fecha, fechaOperativa, didChofer, distancia, tiempo, quien, dataDeRuta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [2, dateYYYYMMDD, dateYYYYMMDD, userId, distance, totalDelay, userId, JSON.stringify(additionalRouteData)]
        );

        const newId = result.insertId;

        const querySetDid = "UPDATE ruteo SET did = ? WHERE superado=0 AND elim=0 AND id = ? LIMIT 1";
        await executeQueryFromPool(pool, querySetDid, [newId, newId]);

        for (const order of orders) {
            const { index, shipmentId, arrivalTime } = order;

            await executeQueryFromPool(
                pool,
                "INSERT INTO ruteo_paradas (didRuteo, tipoParada, didPaquete, retira, didCliente, didDireccion, orden, hora_llegada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [newId, 1, shipmentId, 0, 0, 0, index, arrivalTime]
            );
        }
    } catch (error) {
        logRed(`Error en saveRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error guardando ruta',
            message: error.message,
            stack: error.stack
        });
    }
}