import mysql2 from 'mysql2';

import { getProdDbConfig, executeQuery } from '../../db.js';
import CustomException from '../../classes/custom_exception.js';

export async function geolocalize(company, shipmentId, latitude, longitude) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const queryShipment = `SELECT did FROM envios WHERE did = ${shipmentId}`;

        const resultQuery = await executeQuery(dbConnection, queryShipment);

        if (resultQuery.length > 0) {

            const queryUpdateShipment = `UPDATE envios SET destination_latitude = ${latitude}, destination_longitude = ${longitude}  WHERE did = ${shipmentId}`;

            await executeQuery(dbConnection, queryUpdateShipment);

            const queryUpdateAddress = `UPDATE envios_direcciones_destino SET latitud = ${latitude}, longitud = ${longitude}  WHERE didEnvio = ${shipmentId}`;

            await executeQuery(dbConnection, queryUpdateAddress);

            return;
        } else {
            throw new CustomException({
                title: 'Error geolocalizando',
                message: 'El envío no existe',
            });
        }
    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error geolocalizando',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}