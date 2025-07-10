import { connectionsPools, executeQueryFromPool } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function getSettlementList(companyId, from, to) {
    const pool = connectionsPools[companyId];

    try {
        const sql = `
            SELECT did, DATE_FORMAT(desde, '%d/%m/%Y') AS desde, total,
            DATE_FORMAT(hasta, '%d/%m/%Y') AS hasta, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha
            FROM colecta_liquidaciones
            WHERE superado = 0 AND elim = 0 AND tipo = 2
            AND fecha BETWEEN ? AND ?
            `;

        const result = await executeQueryFromPool(pool, sql, [from, to]);

        const settlementList = result.map(row => ({
            did: Number(row.did),
            total: Number(row.total),
            desde: row.desde,
            hasta: row.hasta,
            fecha: row.fecha
        }));

        return settlementList;
    } catch (error) {
        logRed(`Error en getSettlementList: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en obtener liquidaciones.',
            message: error.message,
            stack: error.stack
        });
    }
}