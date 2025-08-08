import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import LogisticaConf from "../../classes/logisticas_conf.js";


export async function getShipmentIdFromQr(req, company, dbConnection) {

    const dataQr = req.body.dataQr;
    let shipmentId;

    const isLocal = dataQr.hasOwnProperty("local");

    if (isLocal) {
        shipmentId = dataQr.did;

        if (company.did != dataQr.empresa) {
            const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ? AND didEmpresa = ?`;
            const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, [shipmentId, dataQr.empresa]);

            if (resultQueryEnviosExteriores.length == 0) {
                return { message: "El envío no pertenece a la empresa", success: false };
            }

            shipmentId = resultQueryEnviosExteriores[0].didLocal;
        }
    } else {
        if (LogisticaConf.hasBarcodeEnabled(company.did) && !dataQr.hasOwnProperty("sender_id") && !dataQr.hasOwnProperty("t")) {

            const senderId = LogisticaConf.getSenderId(company.did)

            const queryEnvios = `SELECT did FROM envios WHERE ml_shipment_id = ? AND didCliente = ? and superado = 0 AND elim = 0`;
            const resultQueryEnvios = await executeQuery(dbConnection, queryEnvios, [dataQr, senderId], true);

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

            const resultQueryEnvios = await executeQuery(dbConnection, queryEnvios, [mlShipmentId, sellerId]);

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

}