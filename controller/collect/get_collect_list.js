import mysql2 from 'mysql2';
import { connectionsPools, executeQueryFromPool, getProdDbConfig } from '../../db.js';
import CustomException from '../../classes/custom_exception.js';

export async function getCollectList(company, userId, from, to) {
    const pool = connectionsPools[company.did];

    try {
        const query = `
            SELECT fecha, COUNT(didEnvio) as total 
            FROM colecta_asignacion 
            WHERE superado = 0 AND didChofer = ? AND elim = 0 AND fecha BETWEEN ? AND ?
            GROUP BY fecha
            `;

        const results = await executeQueryFromPool(pool, query, [userId, from, to]);

        const collectList = results.map(row => ({ fecha: row.fecha, total: row.total }));

        return collectList
    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en obtener listado de colectas.',
            message: error.message,
            stack: error.stack
        });
    }
}