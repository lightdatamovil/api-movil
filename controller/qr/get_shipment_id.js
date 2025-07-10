import { connectionsPools, executeQueryFromPool } from "../../db.js";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getShipmentIdFromQr(dataQr, companyId) {
    const pool = connectionsPools[companyId];
    try {
        let shipmentId;

        const isLocal = Object.prototype.hasOwnProperty.call(dataQr, "local");

        if (isLocal) {
            shipmentId = dataQr.did;

            if (companyId != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ? AND didEmpresa = ?`;
                const resultQueryEnviosExteriores = await executeQueryFromPool(pool, queryEnviosExteriores, [shipmentId, dataQr.empresa]);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0].didLocal;
            }
        } else {
            if (companyId == 211 && !Object.prototype.hasOwnProperty.call(dataQr, "sender_id")) {
                const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ? AND didCliente = 301`;

                const resultQueryEnvios = await executeQueryFromPool(pool, queryEnvios, [dataQr]);

                if (resultQueryEnvios.length == 0) {
                    throw new CustomException({
                        title: 'Error obteniendo el ID del envío',
                        message: 'No se encontró el envío',
                    });
                }
                shipmentId = `${resultQueryEnvios[0].did}`;

            } else {
                const mlShipmentId = dataQr.id;
                const sellerId = dataQr.sender_id;
                const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ? AND ml_vendedor_id = ? and superado = 0 AND elim = 0`;

                const resultQueryEnvios = await executeQueryFromPool(pool, queryEnvios, [mlShipmentId, sellerId]);

                if (resultQueryEnvios.length == 0) {
                    throw new CustomException({
                        title: 'Error obteniendo el ID del envío',
                        message: 'No se encontró el envío',
                    });
                }
                shipmentId = `${resultQueryEnvios[0].did}`;

            }

        }

        return shipmentId;
    } catch (error) {
        logRed(`Error en getShipmentIdFromQr: ${error}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo el ID del envío',
            message: error.message,
            stack: error.stack
        });
    }
}