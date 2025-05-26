import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logCyan, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getSkuAndStockNoFlex(company, dataQr) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const didEnvio = await getShipmentIdFromQrProd(dataQr, company);

    const queryDidOrden = `SELECT did, didCliente, armado FROM ordenes WHERE superado = 0 AND elim = 0 AND didEnvio = ?`;
    const resultDidOrden = await executeQuery(dbConnection, queryDidOrden, [didEnvio], true);

    if (resultDidOrden.length === 0) {
        return { message: "No se encontró ninguna orden", success: false };
    }

    if (resultDidOrden[0].armado == 1) {
        return { message: "La orden ya fue armada", success: false };
    }

    const didOrden = resultDidOrden[0].did;

    const queryTodo = `
   SELECT oi.cantidad, oi.seller_sku as codigo, fp.sku AS producto_sku, fp.descripcion, fp.ean, fp.did as didProducto, url_imagen
   FROM ordenes_items AS oi
   LEFT JOIN fulfillment_productos AS fp ON (fp.sku = oi.seller_sku AND fp.superado = 0 AND fp.elim = 0)
   WHERE oi.didOrden IN (?);
  `;
    const resultTodo = await executeQuery(dbConnection, queryTodo, [didOrden], true);
    if (resultTodo[0].didProducto == null) {
        return { message: `No se encontró el producto ${resultTodo[0].codigo}`, success: false };
    }
    const l = resultTodo.map((item) => {
        return {
            did: didOrden,
            didProducto: item.didProducto,
            codigo: item.codigo,
            descripcion: item.descripcion,
            ean: item.ean,
            cantidad: item.cantidad,
            url_imagen: item.url_imagen,
        };
    },
    );
    return { body: l, message: "Datos obtenidos correctamente", success: true };
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