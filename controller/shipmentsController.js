import { executeQuery, getProdDbConfig, getClientsByCompany, getDriversByCompany } from '../db.js';
import mysql from 'mysql';

async function verifyAssignment(dbConnection, shipmentId, userId) {
    try {
        const sqlEnviosAsignaciones = "SELECT id FROM envios_asignaciones WHERE didEnvio = ? AND operador = ?";

        const resultQueryEnviosAsignaciones = await executeQuery(dbConnection, sqlEnviosAsignaciones, [shipmentId, userId]);

        return resultQueryEnviosAsignaciones.length > 0 ? true : false;
    } catch (error) {
        console.error("Error en verifyAssignment:", error);
        throw error;
    }
};

function convertirFecha(fecha) {
    // Convertir la fecha del formato 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const fechaObj = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (fechaObj) {
        const [dia, mes, año] = fechaObj;
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
        console.error("Error en getHistorial:", error);
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
        console.error("Error en getObservations:", error);
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
        console.error("Error en getImages:", error);
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
        console.error("Error en shipmentInformation:", error);
        throw error;
    }
}

export async function shipmentDetails(company, shipmentId, userId) {
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
        console.error("Error en shipmentDetails:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function shipmentList(company, userId, profile, from, dashboardValue) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let lineaEnviosHistorial;

        const hoy = new Date().toISOString().slice(0, 10);

        const queryIndices = `
                SELECT envios, envios_historial, fecha 
                FROM tablas_indices 
                WHERE fecha = DATE_SUB(?, INTERVAL 7 DAY) 
                ORDER BY id DESC;
            `;

        const rowss = await executeQuery(dbConnection, queryIndices, [hoy]);

        for (const row of rowss) {
            lineaEnviosHistorial = `eh.id > ${row.envios_historial}`;
        }

        if (!lineaEnviosHistorial) {
            lineaEnviosHistorial = `eh.autofecha > ${desde}`;
        }

        const clientes = await getClientsByCompany(company.did);

        const drivers = await getDriversByCompany(company.did);

        const hour = convertirFecha(from);

        let sqlchoferruteo = "";
        let leftjoinCliente = "";
        let sqlduenio = "";
        let estadoAsignacion = "";

        if (profile == 2) {
            leftjoinCliente = `LEFT JOIN sistema_usuarios_accesos as sua ON (sua.superado = 0 AND sua.elim = 0 AND sua.usuario= ${userId})`;
            sqlduenio = "AND e.didCliente = sua.codigo_empleado";
        } else if (profile == 3) {
            sqlduenio = `AND e.choferAsignado = ${userId}`;
            sqlchoferruteo = ` AND r.didChofer = ${userId}`;
        }

        const campos = `e.did as didEnvio, e.flex, e.ml_shipment_id, ROUND(e.destination_latitude, 8) as lat, 
                        ec.valor as monto_total_a_cobrar, ROUND(e.destination_longitude, 8) AS lng, 
                        e.destination_shipping_zip_code as cp, e.destination_city_name as localidad, 
                        e.ml_venta_id, e.destination_shipping_address_line as address_line, 
                        e.estado_envio, e.destination_comments, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio, 
                        e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, 
                        e.choferAsignado,ei.valor, rp.orden, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial`;

        if (company.did == 4) {
            estadoAsignacion = ', e.estadoAsignacion';
        }

        let query = "";

        if (dashboardValue == -1) {
            query = `SELECT ${campos} ${estadoAsignacion} FROM envios AS e 
                      LEFT JOIN envios_historial as eh on (eh.superado=0 and eh.elim=0 and e.did = eh.didEnvio)
                      LEFT JOIN envios_logisticainversa AS ei ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did)
                      LEFT JOIN envios_observaciones as eo on(eo.superado=0 and eo.elim=0 and eo.didEnvio = e.did) 
                      LEFT JOIN ruteo as r ON( r.elim=0 and r.superado=0 and r.fechaOperativa = now() ${sqlchoferruteo} )
                      LEFT JOIN ruteo_paradas AS rp ON (rp.superado = 0 AND rp.elim = 0 AND rp.didPaquete = e.did and rp.autofecha like '${hoy}%' )
                      LEFT JOIN envios_cobranzas as ec on ( ec.elim=0 and ec.superado=0 and ec.didCampoCobranza = 4 and e.did = ec.didEnvio)
                      ${leftjoinCliente}
                      WHERE e.elim = 0 AND e.superado = 0 AND eh.autofecha > '${hour}' ${sqlduenio} and e.didCliente!=0 
                      ORDER BY rp.orden ASC`;
        } else if (dashboardValue == 1) {
            query = `SELECT eh.didEnvio, e.flex, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial, 
                      e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia, 
                      e.didCliente, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio, 
                      e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad, 
                      e.destination_receiver_phone, edd.latitud as lat, edd.longitud as lng, 
                      e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia ${estadoAsignacion}
                      FROM envios_asignaciones as ea
                      ${leftjoinCliente}
                      LEFT JOIN envios_historial as eh on (eh.superado=0 and eh.elim=0 and ea.didEnvio = eh.didEnvio)
                      LEFT JOIN envios as e ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did)
                      LEFT JOIN clientes as c on (c.superado=0 and c.elim=0 and c.did=e.didCliente)
                      LEFT JOIN envios_direcciones_destino as edd on (edd.superado=0 and edd.elim=0 and edd.didEnvio=eh.didEnvio)
                      LEFT JOIN envios_logisticainversa AS ei ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did)
                      LEFT JOIN envios_observaciones as eo on(eo.superado=0 and eo.elim=0 and eo.didEnvio = eh.didEnvio)
                      LEFT JOIN ruteo as r ON(r.elim=0 and r.superado=0 and r.fechaOperativa = now() ${sqlchoferruteo})
                      LEFT JOIN ruteo_paradas AS rp ON (rp.superado = 0 AND rp.elim = 0 AND rp.didPaquete = e.did and rp.autofecha like '${hoy}%')
                      LEFT JOIN envios_cobranzas as ec on ( ec.elim=0 and ec.superado=0 and ec.didCampoCobranza = 4 and e.did = ec.didEnvio)
                      WHERE ea.superado=0 ${sqlduenio}
                      AND ea.elim=0
                      AND ea.autofecha > '${hoy} 00:00:00'`;
        } else if (dashboardValue == 2 || dashboardValue == 4) {
            query = `
                SELECT eh.didEnvio, e.flex, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial, 
                       e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia, 
                       e.didCliente, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio, 
                       e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad, 
                       e.destination_receiver_phone, edd.latitud as lat, edd.longitud as lng, 
                       e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia 
                       ${estadoAsignacion}
                FROM envios_historial as eh
                ${leftjoinCliente}
                LEFT JOIN envios as e ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did) 
                LEFT JOIN clientes as c ON (c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente) 
                LEFT JOIN envios_direcciones_destino as edd ON (edd.superado = 0 AND edd.elim = 0 AND edd.didEnvio = eh.didEnvio) 
                LEFT JOIN envios_logisticainversa AS ei ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did) 
                LEFT JOIN envios_observaciones as eo ON (eo.superado = 0 AND eo.elim = 0 AND eo.didEnvio = eh.didEnvio) 
                LEFT JOIN ruteo as r ON (r.elim = 0 AND r.superado = 0 AND r.fechaOperativa = NOW() ${sqlchoferruteo})
                LEFT JOIN ruteo_paradas AS rp ON (rp.superado = 0 AND rp.elim = 0 AND rp.didPaquete = e.did AND rp.autofecha LIKE '${hoy}%')
                LEFT JOIN envios_cobranzas as ec ON (ec.elim = 0 AND ec.superado = 0 AND ec.didCampoCobranza = 4 AND e.did = ec.didEnvio)
                WHERE ${lineaEnviosHistorial}
                AND eh.superado = 0
                AND eh.elim = 0
                AND e.elim = 0
                AND e.superado = 0
                AND e.didCliente != 0 
                ${sqlduenio}
                ORDER BY rp.orden ASC;
            `;
        } else if (dashboardValue == 0 || dashboardValue == 3) {
            query = `SELECT eh.didEnvio, DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial, e.flex, 
                      e.didCliente, e.ml_shipment_id, e.ml_venta_id, e.estado_envio, c.nombre_fantasia, 
                      e.didCliente, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio, 
                      e.destination_receiver_name, edd.address_line, edd.cp, edd.localidad, 
                      e.destination_receiver_phone, edd.latitud as lat, edd.longitud as lng, 
                      e.choferAsignado, ei.valor, edd.destination_comments, rp.orden, edd.provincia ${estadoAsignacion} 
                      FROM envios_historial as eh
                      ${leftjoinCliente}
                      LEFT JOIN envios as e ON (e.superado = 0 AND e.elim = 0 AND eh.didEnvio = e.did) 
                      LEFT JOIN clientes as c on (c.superado=0 and c.elim=0 and c.did=e.didCliente) 
                      LEFT JOIN envios_direcciones_destino as edd on (edd.superado=0 and edd.elim=0 and edd.didEnvio=eh.didEnvio) 
                      LEFT JOIN envios_logisticainversa AS ei ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did) 
                      LEFT JOIN envios_observaciones as eo on(eo.superado=0 and eo.elim=0 and eo.didEnvio = eh.didEnvio) 
                      LEFT JOIN ruteo as r ON( r.elim=0 and r.superado=0 and r.fechaOperativa = now() ${sqlchoferruteo} )
                      LEFT JOIN ruteo_paradas AS rp ON (rp.superado = 0 AND rp.elim = 0 AND rp.didPaquete = e.did and rp.autofecha like '${hoy}%')
                      LEFT JOIN envios_cobranzas as ec on ( ec.elim=0 and ec.superado=0 and ec.didCampoCobranza = 4 and e.did = ec.didEnvio)
                      WHERE eh.autofecha > '${hoy} 00:00:00' 
                      AND eh.superado=0
                      AND eh.elim=0
                      AND e.elim = 0
                      AND e.superado = 0
                      ${sqlduenio}
                      AND e.didCliente!=0 
                      AND e.didCliente!='null'
                      ORDER BY rp.orden ASC`;
        }

        const rows = await executeQuery(dbConnection, query, []);

        const lista = [];

        for (const row of rows) {
            const lat = row.lat !== '0' ? row.lat : '0';
            const long = row.lng !== '0' ? row.lng : '0';
            const logisticainversa = row.valor !== null;
            const estadoAsignacion = row.estadoAsignacion || 0;

            const monto = row.monto_total_a_cobrar || 0;

            const nombre = clientes[row.didCliente] ? clientes[row.didCliente].nombre : 'Cliente no encontrado';

            const nombreChofer = drivers[row.choferAsignado] ? drivers[row.choferAsignado].nombre : 'Chofer no encontrado';

            lista.push({
                didEnvio: row.didEnvio * 1,
                flex: row.flex * 1,
                shipmentid: row.ml_shipment_id,
                ml_venta_id: row.ml_venta_id,
                estado: row.estado_envio * 1,
                nombreCliente: nombre || 'Cliente no encontrado',
                didCliente: row.didCliente * 1,
                fechaEmpresa: row.fecha_inicio,
                fechaHistorial: row.fecha_historial || null,
                estadoAsignacion: estadoAsignacion * 1,
                nombreDestinatario: row.destination_receiver_name,
                direccion1: row.address_line,
                direccion2: `CP ${row.cp}, ${row.localidad}`,
                provincia: row.provincia || 'Sin provincia',
                telefono: row.destination_receiver_phone,
                lat: lat,
                long: long,
                logisticainversa: logisticainversa,
                observacionDestinatario: row.destination_comments,
                proximaentrega: false,
                orden: row.orden * 1,
                cobranza: 0,
                chofer: nombreChofer,
                choferId: row.choferAsignado * 1,
                monto_a_cobrar: monto,
            });
        }

        // crearLog(companyId, 0, '/api/envios/listarEnvios', lista, userId);

        return lista;
    } catch (error) {
        console.error("Error en shipmentList", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function nextDeliver(company, shipmentId, date, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const query = "INSERT INTO proximas_entrega (didEnvio, fecha, quien) VALUES (?, ?, ?)";

        await executeQuery(dbConnection, query, [shipmentId, date, userId]);
    } catch (error) {
        console.error("Error en nextDeliver:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}