import { connectionsPools, executeQueryFromPool } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function geolocalize(companyId, shipmentId, latitude, longitude) {
    const pool = connectionsPools[companyId];

    try {
        const queryShipment = `SELECT did FROM envios WHERE did = ${shipmentId}`;

        const resultQuery = await executeQueryFromPool(pool, queryShipment);

        if (resultQuery.length > 0) {

            const queryUpdateShipment = `UPDATE envios SET destination_latitude = ${latitude}, destination_longitude = ${longitude}  WHERE did = ${shipmentId}`;

            await executeQueryFromPool(pool, queryUpdateShipment);

            const queryUpdateAddress = `UPDATE envios_direcciones_destino SET latitud = ${latitude}, longitud = ${longitude}  WHERE didEnvio = ${shipmentId}`;

            await executeQueryFromPool(pool, queryUpdateAddress);

            return;
        } else {
            logRed(`El envío no existe`);
            throw new CustomException({
                title: 'Error geolocalizando',
                message: 'El envío no existe',
            });
        }
    } catch (error) {
        logRed(`Error en geolocalize: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error geolocalizando',
            message: error.message,
            stack: error.stack
        });
    }
}