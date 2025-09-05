import { CustomException, executeQuery, LogisticaConfig } from "lightdata-tools";


export async function getShipmentIdFromQr(dbConnection, req, company) {
    const { dataQr } = req.body;
    let shipmentId;

    const isLocal = Object.prototype.hasOwnProperty.call(dataQr, "local");

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
        if (LogisticaConfig.hasBarcodeEnabled(company.did) && !Object.prototype.hasOwnProperty.call(dataQr, "sender_id") && !Object.prototype.hasOwnProperty.call(dataQr, "t")) {

            const senderId = LogisticaConfig.getSenderId(company.did)

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

    return {
        success: true,
        body: shipmentId,
        message: "Datos obtenidos correctamente",
    };
}