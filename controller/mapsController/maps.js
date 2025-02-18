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

export async function handleRuta(Adatos, company) {
    if (!Adatos.didEmpresa || !Adatos.didUser || !Adatos.perfil) {
        throw new Error("Error al querer obtener la información.");
    }

    // Desestructuración de Adatos
    const { didEmpresa, didUser, perfil, demoraTotal, fechaOpe, distancia, dataRuta, ordenes } = Adatos;

    // Verificar que 'ordenes' esté definido
    if (typeof ordenes === 'undefined') {
        throw new Error("El campo 'ordenes' no está definido en Adatos.");
    }

    // Verificar que 'ordenes' sea un array
    if (!Array.isArray(ordenes)) {
        throw new Error("El campo 'ordenes' debe ser un array.");
    }

    console.log("Ordenes recibidas:", ordenes);  // Agrega logging para verificar el contenido

    const partes = fechaOpe.split('/');
    const formattedFechaOpe = `${partes[2]}-${partes[1]}-${partes[0]}`;

    const fecha = new Date().toISOString().slice(0, 10); // Fecha actual en formato YYYY-MM-DD
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);

    dbConnection.connect(err => {
        if (err) {
            console.error("Error conectando a la base de datos: ", err);
            return;
        }
        console.log("Conectado a la base de datos.");
    });

    try {
        let didAsuperar = 0;
    
        console.log("Valor de didUser:", didUser);
    
        const [rows] = await executeQuery(dbConnection, "SELECT did FROM `ruteo` WHERE superado = 0 AND elim = 0 AND didChofer = ?", [didUser]);
    
        console.log("Resultado de la consulta:", rows);
    
        if (Array.isArray(rows) && rows.length > 0) {
            didAsuperar = rows[0].did;
        } else {
            console.log("No se encontraron registros en la tabla 'ruteo'.");
        }
    
        // Verificar que 'ordenes' está definido y es un array
        if (!Array.isArray(ordenes)) {
            throw new Error("El campo 'ordenes' debe ser un array.");
        }
    
        console.log("Estado de 'ordenes' antes de iterar:", ordenes);
    
        if (ordenes.length > 0) {
            if (didAsuperar !== 0) {
                await executeQuery(dbConnection, "UPDATE `ruteo` SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?", [didAsuperar]);
                await executeQuery(dbConnection, "UPDATE `ruteo_paradas` SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuteo = ?", [didAsuperar]);
            }
    console.log(JSON.stringify(dataRuta),"holaaa");
    
            const result = await executeQuery(
                dbConnection,
                "INSERT INTO ruteo (desde, fecha, fechaOperativa, didChofer, distancia, tiempo, quien, dataDeRuta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [2, fecha, formattedFechaOpe, didUser, distancia, demoraTotal, didUser, JSON.stringify(dataRuta)]
            );
    
            console.log(2, "AAA");  // Este log debería ejecutarse
    
            const idnuevo = result.insertId;
    
            // Imprimir estado de 'ordenes' antes de iterar
            console.log("Iterando sobre 'ordenes':", ordenes);
            
            // Verificar que 'ordenes' sea iterable
            if (Array.isArray(ordenes)) {
                for (const ordendata of ordenes) {
                    if (typeof ordendata !== 'object' || ordendata === null) {
                        throw new Error("Elemento en 'ordenes' no es un objeto válido.");
                    }
    
                    const { orden, envio, ordenLlegada } = ordendata;
    
                    await executeQuery(
                        dbConnection,
                        "INSERT INTO ruteo_paradas (didRuteo, tipoParada, didPaquete, retira, didCliente, didDireccion, orden, hora_llegada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [idnuevo, 1, envio, 0, 0, 0, orden, ordenLlegada]
                    );
                }
            } else {
                throw new Error("El campo 'ordenes' no es iterable.");
            }
    
            return { estadoRespuesta: true, mensaje: "La ruta se guarda exitosamente." };
        } else {
            return { estadoRespuesta: true, mensaje: "No hay ruta para guardar." };
        }
    } catch (error) {
        console.error("Error en handleRuta:", error);
        return { estadoRespuesta: false, mensaje: error.message || "Error interno del servidor." };
    } finally {
        dbConnection.end(); // Asegurarse de cerrar la conexión
    }
}    
