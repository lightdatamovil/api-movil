import { LightdataORM } from "lightdata-tools";

export async function shipmentsFromClient({ db, req }) {
    const { clientId } = req.params;

    const result = await LightdataORM.select({
        dbConnection: db,
        table: "envios",
        where: { didCliente: clientId, estado_envio: 7 },
        select: "did, flex, ml_shipment_id, ml_venta_id"
    });

    const data = result.map(row => ({
        didEnvio: Number(row.did),
        flex: Number(row.flex),
        ml_shipment_id: row.ml_shipment_id || null,
        ml_venta_id: row.ml_venta_id || null
    }));

    return {
        success: true,
        data,
        message: "Envíos obtenidos correctamente",
        meta: {
        }
    };
}