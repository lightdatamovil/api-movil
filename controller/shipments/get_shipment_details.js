import { connectionsPools, executeQueryFromPool } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function shipmentDetails(companyId, shipmentId, userId) {
    const pool = connectionsPools[companyId];

    try {
        let shipmentData = await shipmentInformation(pool, shipmentId);

        let lat = 0;
        let long = 0;

        if (shipmentData.destination_latitude != 0) {
            lat = shipmentData.destination_latitude * 1;
            long = shipmentData.destination_longitude * 1;
        }

        var detallesEnvio = new Object();
        detallesEnvio["nombreDestinatario"] = shipmentData.destination_receiver_name;
        detallesEnvio["nombreCliente"] = "";
        detallesEnvio["didCliente"] = shipmentData.didCliente * 1;
        detallesEnvio["domicilio1"] = shipmentData.destination_shipping_address_line;
        detallesEnvio["domicilio2"] = "CP " + shipmentData.destination_shipping_zip_code + ", " + shipmentData.destination_city_name;
        detallesEnvio["telefono"] = shipmentData.destination_receiver_phone;
        detallesEnvio["observacionDomicilio"] = shipmentData.destination_comments;
        detallesEnvio["estadoActual"] = shipmentData.estado_envio;
        detallesEnvio["id_venta"] = shipmentData.ml_venta_id;
        detallesEnvio["id_envio"] = shipmentData.ml_shipment_id;
        detallesEnvio["cobranza"] = 0;
        detallesEnvio["latitud"] = lat;
        detallesEnvio["longitud"] = long;
        detallesEnvio["monto_a_cobrar"] = shipmentData.monto_a_cobrar ?? 0;

        let asignado = await verifyAssignment(pool, shipmentId, userId);
        detallesEnvio["asignado"] = asignado;

        detallesEnvio["historial"] = [];
        detallesEnvio["observaciones"] = [];
        detallesEnvio["imagenes"] = [];

        const historial = await getHistorial(pool, shipmentId);
        detallesEnvio["historial"] = historial;

        const observaciones = await getObservations(pool, shipmentId);
        detallesEnvio["observaciones"] = observaciones;

        const imagenes = await getImages(pool, shipmentId);
        detallesEnvio["imagenes"] = imagenes;

        return detallesEnvio;

    } catch (error) {
        logRed(`Error en shipmentDetails: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo detalles del envío',
            message: error.message,
            stack: error.stack
        });
    }
}
async function verifyAssignment(pool, shipmentId, userId) {
    try {
        const sqlEnviosAsignaciones = "SELECT id FROM envios_asignaciones WHERE didEnvio = ? AND operador = ?";

        const resultQueryEnviosAsignaciones = await executeQueryFromPool(pool, sqlEnviosAsignaciones, [shipmentId, userId]);

        return resultQueryEnviosAsignaciones.length > 0 ? true : false;
    } catch (error) {
        logRed(`Error en verifyAssignment: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error verificando asignación',
            message: error.message,
            stack: error.stack
        });
    }
};


async function getHistorial(pool, shipmentId) {
    let historial = [];

    try {
        const queryEnviosHistorial = "SELECT estado, date_format(fecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM envios_historial WHERE didenvio = " + shipmentId + " ORDER BY fecha ASC ";

        const resultQueryEnviosHistorial = await executeQueryFromPool(pool, queryEnviosHistorial, []);

        for (let i = 0; i < resultQueryEnviosHistorial.length; i++) {
            var row = resultQueryEnviosHistorial[i];
            historial.push({ estado: row.estado, fecha: row.fecha });
        }

        return historial;
    } catch (error) {
        logRed(`Error en getHistorial: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo historial',
            message: error.message,
            stack: error.stack
        });
    }
}

async function getObservations(pool, shipmentId) {
    let observations = [];

    try {
        const queryEnviosObservaciones = "SELECT observacion, date_format(autofecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM `envios_observaciones` WHERE didenvio = " + shipmentId + " ORDER BY `id` ASC";

        const resultEnviosObservaciones = await executeQueryFromPool(pool, queryEnviosObservaciones, []);

        for (let i = 0; i < resultEnviosObservaciones.length; i++) {
            var row = resultEnviosObservaciones[i];
            observations.push({
                observacion: row.observacion,
                fecha: row.fecha,
            });
        }

        return observations;
    } catch (error) {
        logRed(`Error en getObservations: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo observaciones',
            message: error.message,
            stack: error.stack
        });
    }
}

async function getImages(pool, shipmentId) {
    let images = [];

    try {
        const queryEnviosFotos = "SELECT didenvio, nombre, server FROM `envios_fotos` WHERE didenvio = " + shipmentId + " ORDER BY `id` DESC";

        const resultsEnviosFotos = await executeQueryFromPool(pool, queryEnviosFotos, []);

        for (let i = 0; i < resultsEnviosFotos.length; i++) {
            var row = resultsEnviosFotos[i];
            images.push({
                server: row.server,
                imagen: row.nombre,
                didenvio: row.didenvio,
            });
        }

        return images;
    } catch (error) {
        logRed(`Error en getImages: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo imagenes',
            message: error.message,
            stack: error.stack
        });
    }
}

async function shipmentInformation(pool, shipmentId) {
    try {
        const query = `SELECT
        e.did,
        e.flex,
        e.ml_shipment_id,
        e.didCliente,
        e.destination_latitude,
        e.destination_longitude,
        e.destination_shipping_zip_code,
        e.destination_city_name,
        e.ml_venta_id,
        e.destination_shipping_address_line,
        e.estado_envio,
        e.destination_comments,
        date_format (e.fecha_inicio,'%d/%m/%Y') AS fecha,
        e.destination_receiver_name,
        e.destination_receiver_phone,
        e.didCliente,
        e.choferAsignado,
        ec.valor AS monto_a_cobrar
        FROM envios AS e
        LEFT JOIN envios_cobranzas AS ec ON ( ec.elim=0 AND ec.superado=0 AND ec.didCampoCobranza = 4 AND e.did = ec.didenvio AND e.did = ? )
        WHERE e.did = ? AND e.elim = 0 AND e.superado = 0`;

        const results = await executeQueryFromPool(pool, query, []);
        if (results.length === 0) {
            throw new CustomException({
                title: 'Error obteniendo información del envío',
                message: 'No se encontró el envío con el id: ' + shipmentId,
            });
        }

        return results[0];
    } catch (error) {
        logRed(`Error en shipmentInformation: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo información del envío',
            message: error.message,
            stack: error.stack
        });
    }
}
