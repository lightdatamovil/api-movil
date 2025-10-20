import { getFechaConHoraLocalDePais, LightdataORM, sendShipmentStateToStateMicroserviceAPI } from "lightdata-tools";
import { axiosInstance, urlEstadosMicroservice } from "../../db.js";
export async function enterFlex({ db, req, company }) {
    const { dataQr } = req.body;
    const { userId, profile } = req.user;

    const nowWithHours = getFechaConHoraLocalDePais(company.pais);
    const now = getFechaConHoraLocalDePais(company.pais);
    const fechaunix = Math.floor(Date.now() / 1000);

    const mlShipmentId = dataQr.id;
    const mlSellerId = dataQr.sender_id;

    const [clientResult] = await LightdataORM.select({
        dbConnection: db,
        table: 'clientes_cuentas',
        where: {
            tipoCuenta: 1,
            ML_id_vendedor: mlSellerId
        },
        throwIfNotExists: true
    });

    const clientId = clientResult.didCliente;
    const accountId = clientResult.did;

    await LightdataORM.select({
        dbConnection: db,
        table: 'envios',
        where: {
            ml_shipment_id: mlShipmentId,
            ml_vendedor_id: mlSellerId
        },
        throwIfExists: true,
        throwIfExistsMessage: 'El envío ya se encuentra registrado en el sistema.',
        quien: userId
    });

    const [shipmentId] = await LightdataORM.insert({
        dbConnection: db,
        table: 'envios',
        data: {
            ml_shipment_id: mlShipmentId,
            ml_vendedor_id: mlSellerId,
            didCliente: clientId,
            quien: userId,
            lote: '',
            fecha_despacho: now,
            didCuenta: accountId,
            ml_qr_seguridad: JSON.stringify(dataQr),
            fecha_inicio: nowWithHours,
            fechaunix: fechaunix
        },
        quien: userId
    });

    await sendShipmentStateToStateMicroserviceAPI({
        urlEstadosMicroservice,
        axiosInstance,
        company,
        userId,
        estado: profile === 2 ? 7 : 0,
        shipmentId
    });

    if (profile === 3) {
        await LightdataORM.update({
            dbConnection: db,
            table: 'envios',
            where: {
                did: shipmentId
            },
            data: {
                quien_retiro: userId,
                quien_retiro_fecha: nowWithHours
            }
        });
    }

    return {
        success: true,
        data: { shipmentId },
        message: "Envío registrado correctamente",
        meta: { estadoInicial: profile === 2 ? 7 : 0 }
    };
}