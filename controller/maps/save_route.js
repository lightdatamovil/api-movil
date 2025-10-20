import mysql2 from 'mysql2';

import { getProdDbConfig, executeQuery } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';
import { getFechaLocalDePais } from '../../src/funciones/getFechaLocalByPais.js';

export async function saveRoute(company, userId, orders, distance, totalDelay, additionalRouteData) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let routeId = 0;

        const rows = await executeQuery(dbConnection, "SELECT did FROM `ruteo` WHERE superado = 0 AND elim = 0 AND didChofer = ?", [userId]);
        if (rows.length > 0) {
            routeId = rows[0].did;
        }

        if (routeId !== 0) {
            await executeQuery(dbConnection, "UPDATE `ruteo` SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?", [routeId]);
            // TODO: Verificar si es necesario actualizar las paradas
            // await executeQuery(dbConnection, "UPDATE `ruteo_paradas` SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuteo = ?", [routeId]);
        }
        const dateConHora = getFechaLocalDePais(company.pais);
        // TODO: Que significa este 2??


        // procurrier
        if (company.did == 4) {
            // distancia dividir por 1000 redondear por dos decimales
            distance = Math.round((distance / 1000) * 100) / 100;
        }

        // console.log("distance", distance);

        const result = await executeQuery(
            dbConnection,
            "INSERT INTO ruteo (desde, fecha, fechaOperativa, didChofer, distancia, tiempo, quien, dataDeRuta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [2, dateConHora, dateConHora, userId, distance, totalDelay, userId, JSON.stringify(additionalRouteData)]
        );

        const newId = result.insertId;

        const querySetDid = "UPDATE ruteo SET did = ? WHERE superado=0 AND elim=0 AND id = ? LIMIT 1";
        await executeQuery(dbConnection, querySetDid, [newId, newId]);

        for (const order of orders) {
            const { index, shipmentId, arrivalTime } = order;

            await executeQuery(
                dbConnection,
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
    } finally {
        dbConnection.end();
    }
}