import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getSkuAndStock(company, dataQr) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const didEnvio = await getShipmentIdFromQrProd(dataQr, company);

    const queryDidOrden = `SELECT did FROM ordenes WHERE superado = 0 AND elim = 0 AND didEnvio = ?`;
    const resultDidOrden = await executeQuery(dbConnection, queryDidOrden, [didEnvio]);

    if (resultDidOrden.length === 0) {
        return { message: "No se encontró la orden", success: false };
    }

    const didOrden = resultDidOrden[0].did;

    const querySku = `SELECT seller_sku, cantidad FROM ordenes_items WHERE superado = 0 AND elim = 0 AND didOrden = ?`;
    const resultSku = await executeQuery(dbConnection, querySku, [didOrden]);

    return resultSku;

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
                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, [shipmentId, company.did]);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0].didLocal;
            }
        } else {
            const sellerId = dataQr.sender_id;
            const mlShipmentId = dataQr.id;
            const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ${mlShipmentId} AND ml_vendedor_id = ${sellerId}`;

            const resultQueryEnvios = await executeQuery(dbConnection, queryEnvios, []);

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