import { executeQuery } from 'lightdata-tools';

export async function getSettlementList(dbConnection, req) {
    const { from, to } = req.body;
    const sql = `
            SELECT did, DATE_FORMAT(desde, '%d/%m/%Y') AS desde, total,
            DATE_FORMAT(hasta, '%d/%m/%Y') AS hasta, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha
            FROM colecta_liquidaciones
            WHERE superado = 0 AND elim = 0 AND tipo = 2
            AND fecha BETWEEN ? AND ?
            `;

    const result = await executeQuery(dbConnection, sql, [from, to]);

    const settlementList = result.map(row => ({
        did: Number(row.did),
        total: Number(row.total),
        desde: row.desde,
        hasta: row.hasta,
        fecha: row.fecha
    }));

    return settlementList;
}