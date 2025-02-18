import { executeQuery, getProdDbConfig, getDbConfig } from "../../db.js";
import mysql from 'mysql';
import axios from 'axios';

export async function crossDocking(dataQr, company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;
        let queryWhereId = '';
        const isLocal = dataQr.hasOwnProperty("local")

        if (isLocal) {
            shipmentId = dataQr.did;

            if (company.did != dataQr.empresa) {

                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                shipmentId = resultQueryEnviosExteriores[0];
            }
            queryWhereId = ` AND e.did = ${shipmentId}`;
        } else {
            shipmentId = dataQr.id;
            queryWhereId = ' AND e.ml_shipment_id =' + shipmentId;
        }

        const queryEnvios = `SELECT e.estado_envio, e.didCliente, e.didEnvioZona, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha, 
                      CONCAT(su.nombre, ' ', su.apellido) AS chofer
                      FROM envios AS e
                      LEFT JOIN sistema_usuarios AS su ON su.did = e.choferAsignado AND su.superado = 0 AND su.elim = 0
                      WHERE e.elim = 0 AND e.superado = 0${queryWhereId}`;

        const envioData = await executeQuery(dbConnection, queryEnvios, []);

        return envioData[0];
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getShipmentIdFromQr(dataQr, company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;

        const isLocal = dataQr.hasOwnProperty("local");

        if (isLocal) {
            shipmentId = parseInt(dataQr.did);
            queryWhereId = ` AND e.did = ${shipmentId}`;
            if (company.did != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                shipmentId = resultQueryEnviosExteriores[0];
            }
        } else {
            const senderId = dataQr.sender_id;

            const query = `SELECT did FROM envios WHERE shipmentId = '${dataQr.id}' AND ml_vendedor_id = '${senderId}'`;

            const result = await executeQuery(dbConnection, query, []);

            if (result.length > 0) {
                shipmentId = result[0].did;
            }
        }

        return shipmentId;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function driverList(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        var driverList = [];

        const query = "SELECT u.did, concat( u.nombre,' ', u.apellido) as nombre FROM `sistema_usuarios` as u JOIN sistema_usuarios_accesos as a on ( a.elim=0 and a.superado=0 and a.usuario = u.did) where u.elim=0 and u.superado=0 and a.perfil=3 ORDER BY nombre ASC";

        const results = await executeQuery(dbConnection, query, []);

        for (i = 0; i < results.length; i++) {
            const row = results[i];

            const driver = {
                "id": row.did,
                "nombre": row.nombre
            }

            driverList.push(driver);
        }

        return driverList;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}


// Funciones para obtener datos de la API
async function getTokenData(sellerid) {
    const dia = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://lightdatas2.com.ar/getTokens.php?keysi=${dia}&sellerid=${sellerid}`;
    
    const response = await axios.get(url);
    return response.data[sellerid];
}

async function getDetallesEnvio(idshipment, token) {
    const url = `https://api.mercadolibre.com/shipments/${idshipment}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

async function getDetalleVenta(idventa, token) {
    const url = `https://api.mercadolibre.com/orders/${idventa}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

async function getItemData(iditem, token) {
    const url = `https://api.mercadolibre.com/items/${iditem}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

export async function detalleML(dataQR,company) {

    
    const idshipment = dataQR.id;
    const senderid = dataQR.sender_id.replace(" ", "");
    const token = await getTokenData(senderid);
    const Ashipment = await getDetallesEnvio(idshipment, token);

    if (Ashipment.receiver_id) {
        const Aventa = await getDetalleVenta(Ashipment.order_id, token);
        const Aorder_items = Aventa.order_items || [];
        
        const Aitems = [];
        for (const Aitem of Aorder_items) {
            const itemdata = Aitem.item;
            const cantidadpedida = Aitem.quantity;
            const descripcion = itemdata.title;
            const sku = itemdata.seller_sku;
            const iditem = itemdata.id;
            const variation_id = itemdata.variation_id;

            let stock = 0;
            let imagen = '';

            if (variation_id) {
                const dataitem = await getItemData(iditem, token);
                const Avariations = dataitem.variations;
                for (const variant of Avariations) {
                    if (variant.id === variation_id) {
                        stock = variant.available_quantity;
                        imagen = variant.pictures[0]?.secure_url || '';
                    }
                }
            } else {
                const dataitem = await getItemData(iditem, token);
                imagen = dataitem.pictures[0]?.secure_url || '';
                stock = dataitem.available_quantity;
            }

            Aitems.push({ imagen, stock, cantidadpedida, descripcion, variacion: "", sku });
        }

        return { estado: true, data: Aitems };
    } else {
        return { estado: false, data: "" };
    }
}

