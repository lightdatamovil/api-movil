import { CustomException, executeQuery } from "lightdata-tools";

export async function shipmentDetails(dbConnection, req) {
    const { shipmentId } = req.body;
    const { userId } = req.user;
    let shipmentData = await shipmentInformation(dbConnection, shipmentId);

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

    let asignado = await verifyAssignment(dbConnection, shipmentId, userId);
    detallesEnvio["asignado"] = asignado;

    detallesEnvio["historial"] = [];
    detallesEnvio["observaciones"] = [];
    detallesEnvio["imagenes"] = [];

    const historial = await getHistorial(dbConnection, shipmentId);
    detallesEnvio["historial"] = historial;

    const observaciones = await getObservations(dbConnection, shipmentId);
    detallesEnvio["observaciones"] = observaciones;

    const imagenes = await getImages(dbConnection, shipmentId);
    detallesEnvio["imagenes"] = imagenes;

    return detallesEnvio;
}
async function verifyAssignment(dbConnection, shipmentId, userId) {
    try {
        const sqlEnviosAsignaciones = "SELECT id FROM envios_asignaciones WHERE didEnvio = ? AND operador = ?";

        const resultQueryEnviosAsignaciones = await executeQuery(dbConnection, sqlEnviosAsignaciones, [shipmentId, userId]);

        return resultQueryEnviosAsignaciones.length > 0 ? true : false;
    } catch (error) {
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


async function getHistorial(dbConnection, shipmentId) {
    let historial = [];

    try {
        const queryEnviosHistorial = "SELECT estado, date_format(fecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM envios_historial WHERE didenvio = " + shipmentId + " ORDER BY fecha ASC ";

        const resultQueryEnviosHistorial = await executeQuery(dbConnection, queryEnviosHistorial, []);

        for (let i = 0; i < resultQueryEnviosHistorial.length; i++) {
            var row = resultQueryEnviosHistorial[i];
            historial.push({ estado: row.estado, fecha: row.fecha });
        }

        return historial;
    } catch (error) {
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

async function getObservations(dbConnection, shipmentId) {
    let observations = [];

    try {
        const queryEnviosObservaciones = "SELECT observacion, date_format(autofecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM `envios_observaciones` WHERE didenvio = " + shipmentId + " ORDER BY `id` ASC";

        const resultEnviosObservaciones = await executeQuery(dbConnection, queryEnviosObservaciones, []);

        for (let i = 0; i < resultEnviosObservaciones.length; i++) {
            var row = resultEnviosObservaciones[i];
            observations.push({
                observacion: row.observacion,
                fecha: row.fecha,
            });
        }

        return observations;
    } catch (error) {
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

async function getImages(dbConnection, shipmentId) {
    let images = [];

    const queryEnviosFotos = "SELECT didenvio, nombre, server FROM `envios_fotos` WHERE didenvio = " + shipmentId + " ORDER BY `id` DESC";

    const resultsEnviosFotos = await executeQuery(dbConnection, queryEnviosFotos, []);

    for (let i = 0; i < resultsEnviosFotos.length; i++) {
        var row = resultsEnviosFotos[i];
        images.push({
            server: row.server,
            imagen: row.nombre,
            didenvio: row.didenvio,
        });
    }

    return images;
}

async function shipmentInformation(dbConnection, shipmentId) {
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

    const results = await executeQuery(dbConnection, query, [shipmentId, shipmentId]);
    if (results.length === 0) {
        throw new CustomException({
            title: 'Error obteniendo información del envío',
            message: 'No se encontró el envío con el id: ' + shipmentId,
        });
    }

    return { body: results[0], message: "Datos obtenidos correctamente" };

}
