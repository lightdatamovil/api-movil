import { executeQuery, getFechaConHoraLocalDePais } from 'lightdata-tools';

// NOTA: ESTE ENDPOINT NO SE QUE HACE 
export async function shipmentsFromClient(dbConnection, req, company) {
    const { clientId } = req.body;

    const date = getFechaConHoraLocalDePais(company.pais);
    const sql = `
            SELECT ca.didEnvio, e.ml_shipment_id, e.ml_venta_id, e.flex
            FROM colecta_asignacion AS ca
            JOIN envios AS e ON e.did = ca.didEnvio AND e.superado = 0 AND e.elim = 0
            WHERE ca.superado = 0 AND ca.elim = 0 AND ca.fecha = ? AND ca.didCliente = ?
        `;

    const result = await executeQuery(dbConnection, sql, [date, clientId]);

    let shipmentsFromClient = result.map(row => ({
        didEnvio: Number(row.didEnvio),
        flex: Number(row.flex),
        ml_shipment_id: row.ml_shipment_id || null,
        ml_venta_id: row.ml_venta_id || null
    }));

    return { body: shipmentsFromClient, message: "Envíos obtenidos correctamente" };
}