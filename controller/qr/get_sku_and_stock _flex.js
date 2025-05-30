import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logCyan, logRed, logYellow } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { getItemsFromMLByShipmentId } from "../../src/funciones/getItemsFromMLByShipmentId.js";
import { getOrderFromML } from "../../src/funciones/getOrderFromML.js";

export async function getSkuAndStockFlex(company, dataQr) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const didEnvio = await getShipmentIdFromQrProd(dataQr, company);

        const tracking = dataQr["id"];
        const senderId = dataQr["sender_id"];

        const q = "SELECT did, didCliente FROM clientes_cuentas WHERE ML_id_vendedor = ? AND superado = 0 AND elim = 0";
        const result = await executeQuery(dbConnection, q, [senderId]);

        const token = await getTokenMLconMasParametros(result[0].didCliente, result[0].did, company.did);

        const items = await getItemsFromMLByShipmentId(tracking, token);

        const order = await getOrderFromML(items[0].order_id, token);

        const sellerSKUFromML = order.order_items[0].item.seller_sku;
        const titleFromML = order.order_items[0].item.title;
        const cantidadML = order.order_items[0].quantity;




        const queryData = `SELECT ml_venta_id, ml_pack_id FROM envios WHERE superado = 0 AND elim = 52 AND ml_shipment_id = ?`;
        const resultData = await executeQuery(dbConnection, queryData, [tracking]);

        const idNumber = resultData[0].ml_pack_id || resultData[0].ml_venta_id;

        const queryDidOrden = `SELECT did, didCliente, armado FROM ordenes WHERE superado = 0 AND elim = 0 AND number = ?`;
        const resultDidOrden = await executeQuery(dbConnection, queryDidOrden, [idNumber]);

        if (resultDidOrden.length === 0) {
            return { message: "No se encontró ninguna orden", success: false };
        }

        if (resultDidOrden[0].armado == 1) {
            return { message: "La orden ya fue armada", success: false };
        }

        const didOrden = resultDidOrden[0].did;

        const queryTodo = `
            SELECT descripcion, ean, did as didProducto, url_imagen, sku
            FROM fulfillment_productos
            WHERE sku = ? AND superado = 0 AND elim = 0;
        `;
        const resultTodo = await executeQuery(dbConnection, queryTodo, [sellerSKUFromML], true);
        let l;

        if (resultTodo.length === 0) {
            l = [{
                did: didOrden,
                didProducto: null,
                codigo: sellerSKUFromML,
                title: titleFromML,
                descripcion: null,
                ean: null,
                cantidad: cantidadML,
                url_imagen: null,
                alertada: true
            }];
        } else {
            l = resultTodo.map((item) => {
                return {
                    did: didOrden,
                    didProducto: item.didProducto,
                    codigo: sellerSKUFromML,
                    title: titleFromML,
                    descripcion: item.descripcion,
                    ean: item.ean,
                    cantidad: cantidadML,
                    url_imagen: item.url_imagen,
                    alertada: item.didProducto === null
                };
            });
        }

        return { body: l, message: "Datos obtenidos correctamente", success: true };
    } catch (error) {
        logRed(`Error en getSkuAndStockFlex: ${error.stack}`);
        return { message: error.message, success: false };
    }
    finally {
        dbConnection.end();
    }
}

async function getShipmentIdFromQrProd(dataQr, company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    try {
        let shipmentId;

        const isLocal = dataQr.hasOwnProperty("local");

        if (isLocal) {
            shipmentId = dataQr.did;

            if (company.did != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ? AND didEmpresa = ?`;
                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, [shipmentId, company.did], true);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0].didLocal;
            }
        } else {
            const sellerId = dataQr.sender_id;
            const mlShipmentId = dataQr.id;
            const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ${mlShipmentId} AND ml_vendedor_id = ${sellerId}`;

            const resultQueryEnvios = await executeQuery(dbConnection, queryEnvios, [], true);

            if (resultQueryEnvios.length == 0) {
                throw new CustomException({
                    title: 'Error obteniendo el ID del envío',
                    message: 'No se encontró el envío',
                });
            }

            shipmentId = resultQueryEnvios[0].did;
        }

        return shipmentId;
    } catch (error) {
        logRed(`Error en getShipmentIdFromQr: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo el ID del envío',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}