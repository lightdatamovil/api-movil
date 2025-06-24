import { connectionsPools, executeQuery, executeQueryFromPool, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logCyan, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getShipmentIdFromQr(dataQr, company) {
    const pool = connectionsPools[company.did];
    try {
        let shipmentId;

        const isLocal = dataQr.hasOwnProperty("local");

        if (isLocal) {
            shipmentId = dataQr.did;

            if (company.did != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ? AND didEmpresa = ?`;
                const resultQueryEnviosExteriores = await executeQueryFromPool(pool, queryEnviosExteriores, [shipmentId, company.did]);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0].didLocal;
            }
        } else {
            if (company.did == 211 && !dataQr.hasOwnProperty("sender_id")) {
                logCyan(`getShipmentIdFromQr: Empresa 211, no se encontró sender_id en el QR, usando didCliente 301 para buscar el envío`);
                const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ? AND didCliente = 301`;

                const resultQueryEnvios = await executeQueryFromPool(pool, queryEnvios, [dataQr], true);

                if (resultQueryEnvios.length == 0) {
                    throw new CustomException({
                        title: 'Error obteniendo el ID del envío',
                        message: 'No se encontró el envío',
                    });
                }

                shipmentId = resultQueryEnvios[0].did;
            } else {
                const mlShipmentId = dataQr.id;
                const sellerId = dataQr.sender_id;
                const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ${mlShipmentId} AND ml_vendedor_id = ${sellerId}`;

                const resultQueryEnvios = await executeQueryFromPool(pool, queryEnvios, []);

                if (resultQueryEnvios.length == 0) {
                    throw new CustomException({
                        title: 'Error obteniendo el ID del envío',
                        message: 'No se encontró el envío',
                    });
                }

                shipmentId = resultQueryEnvios[0].did;
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