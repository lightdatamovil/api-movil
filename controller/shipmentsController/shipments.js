const mysql = require('mysql');
const { executeQuery, getProdDbConfig } = require('../../db');

async function verifyAssignment(dbConnection, shipmentId, userId) {
    try {
        const sqlEnviosAsignaciones = "SELECT id FROM envios_asignaciones WHERE didEnvio = ? AND operador = ?";

        const resultQueryEnviosAsignaciones = await executeQuery(dbConnection, sqlEnviosAsignaciones, [shipmentId, userId]);

        return resultQueryEnviosAsignaciones.length > 0 ? true : false;
    } catch (error) {
        throw error;
    }
};

async function getHistorial(dbConnection, shipmentId) {
    let historial = [];

    try {
        const queryEnviosHistorial = "SELECT estado, date_format(fecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM envios_historial WHERE didenvio = " + shipmentId + " ORDER BY fecha ASC ";

        const resultQueryEnviosHistorial = await executeQuery(dbConnection, queryEnviosHistorial, []);

        for (i = 0; i < resultQueryEnviosHistorial.length; i++) {
            var row = resultQueryEnviosHistorial[i];
            historial.push({ estado: row.estado, fecha: row.fecha });
        }

        return historial;
    } catch (error) {
        throw error;
    }
}

async function getObservations(dbConnection, shipmentId) {
    let observations = [];

    try {
        const queryEnviosObservaciones = "SELECT observacion, date_format(autofecha,'%d/%m/%Y %H:%i:%s') AS fecha FROM `envios_observaciones` WHERE didenvio = " + shipmentId + " ORDER BY `id` ASC";

        const resultEnviosObservaciones = await executeQuery(dbConnection, queryEnviosObservaciones, []);

        for (i = 0; i < resultEnviosObservaciones.length; i++) {
            var row = resultEnviosObservaciones[i];
            observations.push({
                observacion: row.observacion,
                fecha: row.fecha,
            });
        }

        return observations;
    } catch (error) {
        throw error;
    }
}

async function getImages(dbConnection, shipmentId) {
    let images = [];

    try {
        const queryEnviosFotos = "SELECT didenvio, nombre, server FROM `envios_fotos` WHERE didenvio = " + shipmentId + " ORDER BY `id` DESC";

        const resultsEnviosFotos = await executeQuery(dbConnection, queryEnviosFotos, []);

        for (i = 0; i < resultsEnviosFotos.length; i++) {
            var row = resultsEnviosFotos[i];
            images.push({
                server: row.server,
                imagen: row.nombre,
                didenvio: row.didenvio,
            });
        }

        return images;
    } catch (error) {
        throw error;
    }
}

async function shipmentInformation(dbConnection, shipmentId) {
    try {
        const query = "SELECT e.did, e.flex, e.ml_shipment_id, e.didCliente, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name, e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') AS fecha, e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ec.valor AS monto_a_cobrar FROM envios AS e LEFT JOIN envios_cobranzas AS ec ON ( ec.elim=0 AND ec.superado=0 AND ec.didCampoCobranza = 4 AND e.did = ec.didenvio AND e.did = " + shipmentId + ") WHERE e.did = " + shipmentId;

        const results = await executeQuery(dbConnection, query, []);

        return results[0];
    } catch (error) {
        throw error;
    }
}

async function shipmentDetails(company, shipmentId, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {

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
        detallesEnvio["monto_a_cobrar"] = (shipmentData.monto_a_cobrar ?? 0).toString();

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

    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function shipmentList(companyId, userId, profile, from, to) {

    const dbConfig = getProdConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const clientes = await getClientes(connection, companyId);

        const hoy = new Date().toISOString().slice(0, 10);
        const d = convertirFecha(from);

        let sqlchoferruteo = "";
        let leftjoinCliente = "";
        let sqlduenio = "";

        if (profile == 2) {
            leftjoinCliente = "LEFT JOIN sistema_usuarios_accesos as sua ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario= ?)";
            sqlduenio = "AND e.didCliente = sua.codigo_empleado";
        } else if (profile == 3) {
            sqlduenio = "AND e.didChofer = ?";
            sqlchoferruteo = " AND r.didChofer = ?";
        }

        const campos = `e.did as didEnvio, e.flex, e.shipmentid, ROUND(e.lat, 8) as lat, 
                     ROUND(e.long, 8) AS lng, 
                     e.nombreCliente, e.didCliente,
                     DATE_FORMAT(e.fechaInicio, '%d/%m/%Y') as fecha_inicio, 
                     e.estado as estado_envio, e.observacionDestinatario, 
                     e.orden, e.monto_a_cobrar,
                     e.nombreDestinatario, e.direccion1 as address_line, 
                     e.telefono as destination_receiver_phone, 
                     DATE_FORMAT(e.autofecha, '%d/%m/%Y') as fecha_historial`;

        let query = `SELECT ${campos} FROM envios AS e 
                   ${leftjoinCliente} 
                   WHERE e.activo = 1 AND e.didCliente != 0 
                   AND e.fechaInicio BETWEEN ? AND ? ${sqlduenio} 
                   ORDER BY e.orden ASC`;

        const rows = await executeQuery(dbConnection, query, [d, hoy, userId]);

        const lista = rows.map(row => {
            return {
                didEnvio: row.didEnvio * 1,
                flex: row.flex * 1,
                shipmentid: row.shipmentid,
                estado: row.estado_envio * 1,
                nombreCliente: clientes[row.didCliente] || 'Cliente no encontrado',
                didCliente: row.didCliente * 1,
                fechaEmpresa: row.fecha_inicio,
                fechaHistorial: row.fecha_historial || null,
                nombreDestinatario: row.nombreDestinatario,
                direccion1: row.address_line,
                direccion2: row.direccion2 || '',
                telefono: row.destination_receiver_phone,
                lat: row.lat || '0',
                long: row.lng || '0',
                observacionDestinatario: row.observacionDestinatario,
                orden: row.orden * 1,
                monto_a_cobrar: row.monto_a_cobrar || "0",
            };
        });

        // crearLog(didEmpresa, 0, '/api/envios/listarEnvios', lista, diduser);

        return { body: lista, mensaje: 'Datos obtenidos correctamente' };
    } catch (error) {
        throw error;
    } finally {
        connection.end();
    }
}
module.exports = {
    shipmentDetails,
    listarEnviosToken: shipmentList,
};