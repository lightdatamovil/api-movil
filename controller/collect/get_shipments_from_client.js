import { executeQuery } from 'lightdata-tools';

// NOTA: ESTE ENDPOINT NO SE QUE HACE 
export async function shipmentsFromClient(dbConnection, req) {
    const { clientId } = req.params;

    const sql = `
            SELECT did, flex, ml_shipment_id, ml_venta_id
            FROM envios
            WHERE estado_envio = 7 and didCliente = ? AND superado = 0 AND elim = 0
        `;

    const result = await executeQuery(dbConnection, sql, [clientId], true);

    let shipmentsFromClient = result.map(row => ({
        didEnvio: Number(row.did),
        flex: Number(row.flex),
        ml_shipment_id: row.ml_shipment_id || null,
        ml_venta_id: row.ml_venta_id || null
    }));

    return { body: shipmentsFromClient, message: "Envíos obtenidos correctamente" };
}