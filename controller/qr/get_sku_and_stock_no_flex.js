import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logCyan, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getSkuAndStockNoFlex(company, dataQr) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    try {
        const didEnvio = await getShipmentIdFromQrProd(dataQr, company);

        const queryDidOrden = `SELECT did, didCliente, armado FROM ordenes WHERE superado = 0 AND elim = 0 AND didEnvio = ?`;
        const resultDidOrden = await executeQuery(dbConnection, queryDidOrden, [didEnvio]);

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
        const resultTodo = await executeQuery(dbConnection, queryTodo, [didOrden]);
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
    } catch (error) {
        logRed(`Error en getSkuAndStockNoFlex: ${error.stack}`);
        return { message: error.message, success: false };
    } finally {
        dbConnection.end();
    }
}
