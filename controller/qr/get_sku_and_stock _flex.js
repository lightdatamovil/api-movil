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
        const tracking = dataQr["id"];



        const queryData = `SELECT ml_venta_id, ml_pack_id FROM envios WHERE superado = 0 AND elim = 52 AND ml_shipment_id = ?`;
        const resultData = await executeQuery(dbConnection, queryData, [tracking], true);

        if (!resultData || resultData.length === 0) {
            return { message: "No se encontró el envío", success: false };
        }
        const idNumber = (resultData[0].ml_pack_id ?? resultData[0].ml_venta_id);

        const queryDidOrden = `SELECT did, didCliente, armado FROM ordenes WHERE superado = 0 AND elim = 0 AND number = ?`;
        const resultDidOrden = await executeQuery(dbConnection, queryDidOrden, [idNumber]);

        if (resultDidOrden.length === 0) {
            return { message: "No se encontró ninguna orden", success: false };
        }

        if (resultDidOrden[0].armado == 1) {
            return { message: "La orden ya fue armada", success: false };
        }

        const didOrden = resultDidOrden[0].did;


        const listaItemApp = [];

        const senderId = dataQr["sender_id"];

        const q = "SELECT did, didCliente FROM clientes_cuentas WHERE ML_id_vendedor = ? AND superado = 0 AND elim = 0";
        const result = await executeQuery(dbConnection, q, [senderId]);

        const token = await getTokenMLconMasParametros(result[0].didCliente, result[0].did, company.did);

        const items = await getItemsFromMLByShipmentId(tracking, token);
        for (let i = 0; i < items.length; i++) {
            const itemML = items[i];

            const order = await getOrderFromML(itemML.order_id, token);
            const cantidadML = order.order_items[0].quantity;
            for (let index = 0; index < order.order_items.length; index++) {
                const element = order.order_items[index].item;
                const sellerSKUFromML = element.seller_sku;
                const titleFromML = element.title;
                const queryTodo = `
                    SELECT descripcion, ean, did as didProducto, url_imagen, sku
                    FROM fulfillment_productos
                    WHERE sku = ? AND superado = 0 AND elim = 0 AND didCliente = ?
                `;
                const resultTodo = await executeQuery(dbConnection, queryTodo, [sellerSKUFromML, result[0].didCliente]);
                listaItemApp.push({

                    did: didOrden,
                    didProducto: resultTodo.length === 0 ? null : resultTodo[0].didProducto,
                    codigo: sellerSKUFromML,
                    title: titleFromML,
                    descripcion: resultTodo.length === 0 ? null : resultTodo[0].descripcion,
                    ean: resultTodo.length === 0 ? null : resultTodo[0].ean,
                    cantidad: cantidadML,
                    url_imagen: resultTodo.length === 0 ? null : resultTodo[0].url_imagen,
                    alertada: resultTodo.length === 0 ? true : resultTodo[0].didProducto === null
                });
            }
        }

        return { body: listaItemApp, message: "Datos obtenidos correctamente", success: true };
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