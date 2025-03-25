import { executeQuery, getProdDbConfig, getClientsByCompany, getDriversByCompany } from '../db.js';
import mysql2 from 'mysql';
import { logRed, logYellow } from '../src/funciones/logsCustom.js';

async function verifyAssignment(dbConnection, shipmentId, userId) {
    try {
        const sqlEnviosAsignaciones = "SELECT id FROM envios_asignaciones WHERE didEnvio = ? AND operador = ?";

        const resultQueryEnviosAsignaciones = await executeQuery(dbConnection, sqlEnviosAsignaciones, [shipmentId, userId]);

        return resultQueryEnviosAsignaciones.length > 0 ? true : false;
    } catch (error) {
        logRed(`Error en verifyAssignment: ${error.stack}`);
        throw error;
    }
};

function convertirFecha(fecha) {
    const fechaObj = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (fechaObj) {
        const [, dia, mes, año] = fechaObj;

        return `${año}-${mes}-${dia} 00:00:00`;
    } else {
        return "Fecha inválida";
    }
}

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
        logRed(`Error en getHistorial: ${error.stack}`);
        throw error;
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
        logRed(`Error en getObservations: ${error.stack}`);
        throw error;
    }
}

async function getImages(dbConnection, shipmentId) {
    let images = [];

    try {
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
    } catch (error) {
        logRed(`Error en getImages: ${error.stack}`);
        throw error;
    }
}

async function shipmentInformation(dbConnection, shipmentId) {
    try {
        const query = "SELECT e.did, e.flex, e.ml_shipment_id, e.didCliente, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name, e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') AS fecha, e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ec.valor AS monto_a_cobrar FROM envios AS e LEFT JOIN envios_cobranzas AS ec ON ( ec.elim=0 AND ec.superado=0 AND ec.didCampoCobranza = 4 AND e.did = ec.didenvio AND e.did = " + shipmentId + ") WHERE e.did = " + shipmentId;

        const results = await executeQuery(dbConnection, query, []);
        if (results.length === 0) {
            throw new Error("No se encontró el envío con el id: " + shipmentId);
        }

        return results[0];
    } catch (error) {
        logRed(`Error en shipmentInformation: ${error.stack}`);
        throw error;
    }
}

export async function shipmentDetails(company, shipmentId, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
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

    } catch (error) {
        logRed(`Error en shipmentDetails: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function shipmentList(company, userId, profile, from, dashboardValue) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let lineaEnviosHistorial;
        const hoy = new Date().toISOString().slice(0, 10);

        // Recuperar el índice para filtrar el historial
        const queryIndices = `
            SELECT envios, envios_historial, fecha 
            FROM tablas_indices 
            WHERE fecha = DATE_SUB(?, INTERVAL 7 DAY) 
            ORDER BY id DESC;
        `;
        const rowss = await executeQuery(dbConnection, queryIndices, [hoy]);
        for (const row of rowss) {
            lineaEnviosHistorial = `eh.id > ${row.envios_historial} `;
        }
        if (!lineaEnviosHistorial) {
            lineaEnviosHistorial = `eh.autofecha > ${from} `;
        }

        // Obtener clientes y choferes
        const clientes = await getClientsByCompany(dbConnection, company.did);
        const drivers = await getDriversByCompany(dbConnection, company.did);
        const dateWithHour = convertirFecha(from);

        // Variables para personalizar la consulta según el perfil
        let sqlchoferruteo = "";
        let leftjoinCliente = "";
        let sqlduenio = "";
        let estadoAsignacion = "";

        if (profile == 2) {
            leftjoinCliente = `LEFT JOIN sistema_usuarios_accesos as sua ON(sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ${userId})`;
            sqlduenio = "AND e.didCliente = sua.codigo_empleado";
        } else if (profile == 3) {
            sqlduenio = `AND e.choferAsignado = ${userId} `;
            sqlchoferruteo = ` AND r.didChofer = ${userId} `;
        }
        if (company.did == 4) {
            estadoAsignacion = ', e.estadoAsignacion';
        }

        // Campos para dashboardValue = 5:
        // Los campos de destinatario se sacan de la tabla envios y los de dirección de edd,
        // incluyendo destination_comments, que ahora se obtiene desde edd.
        const campos = `
            e.did as didEnvio, e.flex, e.ml_shipment_id, 
            ec.valor as monto_total_a_cobrar, e.ml_venta_id, e.estado_envio, edd.destination_comments, 
            DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio,
            e.destination_receiver_name, e.destination_receiver_phone, e.didCliente,
            e.choferAsignado, ei.valor, rp.orden, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial,
            pe.id as proximaentregaId,
            edd.address_line, edd.cp, edd.localidad,
            edd.latitud as lat, edd.longitud as lng
        `;

        // JOINs comunes para todas las ramas, incluyendo la dirección (de edd)
        const commonJoins = `
            LEFT JOIN envios_direcciones_destino AS edd
                ON (edd.superado = 0 AND edd.elim = 0 AND edd.didEnvio = e.did)
            LEFT JOIN ruteo AS r 
                ON (r.elim = 0 AND r.superado = 0 AND r.fechaOperativa = CURDATE() ${sqlchoferruteo})
            LEFT JOIN ruteo_paradas AS rp 
                ON (rp.superado = 0 AND rp.elim = 0 AND rp.didPaquete = e.did 
                    AND rp.didRuteo = r.did AND rp.autofecha LIKE '${hoy}%')
            LEFT JOIN envios_cobranzas AS ec 
                ON (ec.elim = 0 AND ec.superado = 0 AND ec.didCampoCobranza = 4 
                    AND e.did = ec.didEnvio)
            LEFT JOIN proximas_entregas AS pe 
                ON (pe.elim = 0 AND pe.superado = 0 AND pe.didEnvio = e.did 
                    AND pe.fecha >= '${hoy}')
            ${leftjoinCliente}
        `;

        let selectColumns = "";
        let fromClause = "";
        let joinClause = "";
        let whereClause = "";
        let groupClause = "";
        const orderClause = "ORDER BY rp.orden ASC";

        // Construir la query según el dashboardValue
        switch (dashboardValue) {
            case 5:
                selectColumns = `${campos} ${estadoAsignacion}`;
                fromClause = "FROM envios AS e";
                joinClause = `
                    LEFT JOIN envios_historial AS eh 
                        ON (eh.superado = 0 AND eh.elim = 0 AND e.did = eh.didEnvio)
                    LEFT JOIN envios_logisticainversa AS ei 
                        ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did)
                    LEFT JOIN envios_observaciones AS eo 
                        ON (eo.superado = 0 AND eo.elim = 0 AND eo.didEnvio = e.did)
                    ${commonJoins}
                `;
                whereClause = `
                    WHERE e.elim = 0 AND e.superado = 0 
                    AND eh.autofecha > '${dateWithHour}' ${sqlduenio} 
                    AND e.didCliente != 0
                `;
                break;

            case 1:
                selectColumns = `
                    eh.didEnvio, e.flex, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') AS fecha_historial,
                    e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia,
                    DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha_inicio,
                    e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad,
                    e.destination_receiver_phone, edd.latitud AS lat, edd.longitud AS lng,
                    e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia ${estadoAsignacion}
                `;
                fromClause = "FROM envios_asignaciones AS ea";
                joinClause = `
                    ${leftjoinCliente}
                    LEFT JOIN envios_historial AS eh 
                        ON (eh.superado = 0 AND eh.elim = 0 AND ea.didEnvio = eh.didEnvio)
                    LEFT JOIN envios AS e 
                        ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did)
                    LEFT JOIN clientes AS c 
                        ON (c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente)
                    ${commonJoins}
                `;
                whereClause = `
                    WHERE ea.superado = 0 ${sqlduenio}
                      AND ea.elim = 0
                      AND ea.autofecha > '${hoy} 00:00:00'
                `;
                groupClause = "GROUP BY ea.didEnvio";
                break;

            case 2:
            case 4:
                selectColumns = `
                    eh.didEnvio, e.flex, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') AS fecha_historial,
                    e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia,
                    DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha_inicio,
                    e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad,
                    e.destination_receiver_phone, edd.latitud AS lat, edd.longitud AS lng,
                    e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia ${estadoAsignacion}
                `;
                fromClause = "FROM envios_historial AS eh";
                joinClause = `
                    ${leftjoinCliente}
                    LEFT JOIN envios AS e 
                        ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did)
                    LEFT JOIN clientes AS c 
                        ON (c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente)
                    ${commonJoins}
                `;
                whereClause = `
                    WHERE ${lineaEnviosHistorial}
                      AND eh.superado = 0 AND eh.elim = 0
                      AND e.elim = 0 AND e.superado = 0
                      AND e.didCliente != 0 ${sqlduenio}
                `;
                groupClause = "GROUP BY eh.didEnvio";
                break;

            case 0:
            case 3:
                selectColumns = `
                    eh.didEnvio, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') AS fecha_historial, e.flex,
                    e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia,
                    DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha_inicio,
                    e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad,
                    e.destination_receiver_phone, edd.latitud AS lat, edd.longitud AS lng,
                    e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia ${estadoAsignacion}
                `;
                fromClause = "FROM envios_historial AS eh";
                joinClause = `
                    ${leftjoinCliente}
                    LEFT JOIN envios AS e 
                        ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did)
                    LEFT JOIN clientes AS c 
                        ON (c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente)
                    ${commonJoins}
                `;
                whereClause = `
                    WHERE eh.autofecha > '${hoy} 00:00:00'
                      AND eh.superado = 0 AND eh.elim = 0
                      AND e.elim = 0 AND e.superado = 0
                      ${sqlduenio} 
                      AND e.didCliente != 0 AND e.didCliente != 'null'
                `;
                groupClause = "GROUP BY eh.didEnvio";
                break;
        }

        // Construir la consulta final
        const finalQuery = `
            SELECT ${selectColumns}
            ${fromClause}
            ${joinClause}
            ${whereClause}
            ${groupClause ? groupClause : ""}
            ${orderClause};
        `;

        const rows = await executeQuery(dbConnection, finalQuery, []);
        const lista = [];
        for (const row of rows) {
            const lat = row.lat !== '0' ? row.lat : '0';
            const long = row.lng !== '0' ? row.lng : '0';
            const logisticainversa = row.valor !== null;
            const estadoAsignacionVal = row.estadoAsignacion || 0;
            const monto = row.monto_total_a_cobrar || 0;
            const nombre = clientes[row.didCliente] ? clientes[row.didCliente].nombre : 'Cliente no encontrado';
            const nombreChofer = drivers[row.choferAsignado] ? drivers[row.choferAsignado].nombre : 'Chofer no encontrado';
            const isOnTheWay = (row.estado_envio == 2 || row.estado_envio == 11 || row.estado_envio == 12) ||
                (company.did == 20 && row.estado_envio == 16);

            lista.push({
                didEnvio: row.didEnvio * 1,
                flex: row.flex * 1,
                shipmentid: row.ml_shipment_id,
                ml_venta_id: row.ml_venta_id,
                estado: row.estado_envio * 1,
                nombreCliente: nombre,
                didCliente: row.didCliente * 1,
                fechaEmpresa: row.fecha_inicio,
                fechaHistorial: row.fecha_historial || null,
                estadoAsignacion: estadoAsignacionVal * 1,
                nombreDestinatario: row.destination_receiver_name,
                direccion1: row.address_line,
                direccion2: `CP ${row.cp}, ${row.localidad} `,
                provincia: row.provincia || 'Sin provincia',
                telefono: row.destination_receiver_phone,
                lat: lat,
                long: long,
                logisticainversa: logisticainversa,
                observacionDestinatario: row.destination_comments,
                hasNextDeliverButton: isOnTheWay && row.proximaentregaId == null,
                orden: row.orden * 1,
                cobranza: 0,
                chofer: nombreChofer,
                choferId: row.choferAsignado * 1,
                monto_a_cobrar: monto,
            });
        }
        return lista;
    } catch (error) {
        logRed(`Error en shipmentList: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function nextDeliver(company, shipmentId, dateYYYYMMDD, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const query = "INSERT INTO proximas_entregas (didEnvio, fecha, quien) VALUES (?, ?, ?)";

        await executeQuery(dbConnection, query, [shipmentId, dateYYYYMMDD, userId]);
    } catch (error) {
        logRed(`Error en nextDeliver: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}