import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../../db.js';
export async function getRoutaByUserId(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipments = [];

        let additionalRouteData;

        const today = new Date().toISOString().split('T')[0];

        const rutaQuery = "SELECT id FROM `ruteo` WHERE superado=0 AND elim=0 AND fechaOperativa = ? AND didChofer = ?";
        const rutaResult = await executeQuery(dbConnection, rutaQuery, [today, userId]);

        // if (rutaResult.length > 0) {
        //     const getRouteShipmentsQuery = `
        //         SELECT e.did, e.destination_shipping_address_line, e.destination_latitude, e.destination_longitude,  
        //             e.destination_comments, e.destination_city_name, e.destination_shipping_zip_code, 
        //             e.destination_state_name, ea.orden, RP.orden AS ordenRuteo, e.ml_shipment_id, 
        //             c.nombre_fantasia, e.destination_receiver_name, DATE(e.fecha_venta) as fechaVenta, 
        //             R.dataDeRuta as dataR
        //         FROM envios as e 
        //         LEFT JOIN clientes AS c ON (c.elim = 0 AND c.superado = 0 AND c.did = e.didCliente)
        //         LEFT JOIN ruteo AS R ON (R.superado = 0 AND R.elim = 0 AND R.didChofer = ?)
        //         LEFT JOIN ruteo_paradas AS RP ON (RP.superado = 0 AND RP.elim = 0 AND R.did = RP.didRuteo AND RP.didPaquete = e.did)
        //         JOIN envios_asignaciones as ea ON (ea.didEnvio = e.did AND ea.superado = 0 AND ea.elim = 0 AND ea.operador = ?)
        //         WHERE e.superado = 0 AND e.elim = 0 AND e.estado_envio IN (0,1,2,7,6,9,10,12)
        //         ORDER BY RP.orden ASC`;

        //     const getRouteShipmentsQueryResult = await executeQuery(dbConnection, getRouteShipmentsQuery, [userId, userId]);

        //     for (let row of getRouteShipmentsQueryResult) {
        //         let latitude = row.destination_latitude ? parseFloat(row.destination_latitude) : null;
        //         let longitude = row.destination_longitude ? parseFloat(row.destination_longitude) : null;

        //         shipments.push({
        //             id: row.did,
        //             direccion: row.destination_shipping_address_line || "",
        //             localidad: row.destination_city_name || "",
        //             provincia: row.destination_state_name || "",
        //             idTracking: row.ml_shipment_id || "",
        //             latitud: latitude,
        //             longitud: longitude,
        //             orden: row.ordenRuteo ? parseInt(row.ordenRuteo) : null,
        //             quienRecibe: row.destination_receiver_name || "",
        //             fechaVenta: row.fechaVenta || "",
        //             nombreCliente: row.nombre_fantasia || "",
        //         });

        //         additionalRouteData = JSON.parse(row.dataR);
        //     }
        // } else {
        //     // No tiene ruta asignada, obtener envíos sin orden
        //     const shipmentsWithoutOrderQuery = `
        //         SELECT e.did, e.destination_shipping_address_line, e.destination_latitude, e.destination_longitude, 
        //             e.destination_comments, e.destination_city_name, e.destination_shipping_zip_code, 
        //             e.destination_state_name, e.ml_shipment_id, c.nombre_fantasia, e.destination_receiver_name, 
        //             DATE(e.fecha_venta) as fechaVenta
        //         FROM envios as e 
        //         LEFT JOIN clientes AS c ON (c.elim = 0 AND c.superado = 0 AND c.did = e.didCliente) 
        //         JOIN envios_asignaciones as ea ON (ea.didEnvio = e.did AND ea.superado = 0 AND ea.elim = 0 AND ea.operador = ?)
        //         WHERE e.superado = 0 AND e.elim = 0 AND e.estado_envio IN (0,1,2,7,6,9,10,12)
        //         ORDER BY ea.orden ASC`;

        //     const shipmentsWithoutOrderResult = await executeQuery(dbConnection, shipmentsWithoutOrderQuery, [userId]);

        //     for (let row of shipmentsWithoutOrderResult) {
        //         let latitude = row.destination_latitude ? parseFloat(row.destination_latitude) : null;
        //         let longitude = row.destination_longitude ? parseFloat(row.destination_longitude) : null;

        //         shipments.push({
        //             id: row.did,
        //             direccion: row.destination_shipping_address_line || "",
        //             localidad: row.destination_city_name || "",
        //             provincia: row.destination_state_name || "",
        //             idTracking: row.ml_shipment_id || "",
        //             latitud: latitude,
        //             longitud: longitude,
        //             quienRecibe: row.destination_receiver_name || "",
        //             fechaVenta: row.fechaVenta || "",
        //             nombreCliente: row.nombre_fantasia || "",
        //         });
        //     }
        // }

        return {
            hasRoute: rutaResult.length > 0,
            shipments: shipments,
            additionalRouteData: additionalRouteData,
        };
    } catch (error) {
        throw error;
    }
    finally {
        dbConnection.end();
    }
}
