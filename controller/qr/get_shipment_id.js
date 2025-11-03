import { LightdataORM, LogisticaConfig } from "lightdata-tools";

export async function getShipmentIdFromQr({ db, req, company }) {
    const { dataQr } = req.body;

    let shipmentId;

    const isLocal = Object.prototype.hasOwnProperty.call(dataQr, "local");

    if (isLocal) {
        shipmentId = dataQr.did;

        if (company.did !== dataQr.empresa) {
            const [result] = await LightdataORM.select({
                db,
                table: "envios_exteriores",
                where: {
                    didExterno: shipmentId,
                    didEmpresa: dataQr.empresa
                },
                select: "didLocal",
                throwIfNotExists: true
            });
            shipmentId = result.didLocal;
        }
    } else {
        const hasBarcode = LogisticaConfig.hasBarcodeEnabled(company.did);
        const hasSender = Object.prototype.hasOwnProperty.call(dataQr, "sender_id");
        const hasType = Object.prototype.hasOwnProperty.call(dataQr, "t");

        if (hasBarcode && !hasSender && !hasType) {
            const senderId = LogisticaConfig.getSenderId(company.did);

            const [result] = await LightdataORM.select({
                db,
                table: "envios",
                where: {
                    ml_shipment_id: dataQr,
                    didCliente: senderId
                },
                select: "did",
                throwIfNotExists: true
            });

            shipmentId = result.did;
        } else {
            const [result] = await LightdataORM.select({
                db,
                table: "envios",
                where: {
                    ml_shipment_id: dataQr.id,
                    ml_vendedor_id: dataQr.sender_id
                },
                select: "did",
                throwIfNotExists: true
            });

            shipmentId = result.did;
        }
    }

    return {
        success: true,
        data: { shipmentId: Number(shipmentId) },
        message: "Datos obtenidos correctamente",
        meta: {},
    };
}
