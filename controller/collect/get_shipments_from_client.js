import { connectionsPools, executeQueryFromPool } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function shipmentsFromClient(companyId, dateYYYYMMDD, clientId) {
    const pool = connectionsPools[companyId];

    try {
        const sql = `
            SELECT ca.didEnvio, e.ml_shipment_id, e.ml_venta_id, e.flex
            FROM colecta_asignacion AS ca
            JOIN envios AS e ON e.did = ca.didEnvio AND e.superado = 0 AND e.elim = 0
            WHERE ca.superado = 0 AND ca.elim = 0 AND ca.fecha = ? AND ca.didCliente = ?
        `;

        const result = await executeQueryFromPool(pool, sql, [dateYYYYMMDD, clientId]);

        let shipmentsFromClient = result.map(row => ({
            didEnvio: Number(row.didEnvio),
            flex: Number(row.flex),
            ml_shipment_id: row.ml_shipment_id || null,
            ml_venta_id: row.ml_venta_id || null
        }));

        return shipmentsFromClient;
    } catch (error) {
        logRed(`Error en shipmentsFromClient: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en obtener envios de cliente.',
            message: error.message,
            stack: error.stack
        });
    }
}