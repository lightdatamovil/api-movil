import { executeQuery, executeQueryFromPool, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function getSettlementList(company, userId, from, to) {
    const pool = connectionsPools[company.did];

    try {
        const dateFrom = new Date(from).toISOString().split('T')[0];
        const dateTo = new Date(to).toISOString().split('T')[0];

        const query = `
            SELECT l.did, l.total, DATE_FORMAT(l.autofecha, '%d-%m-%Y') AS fecha,
                   CONCAT(u.nombre, ' ', u.apellido) AS quienLiquido
            FROM liquidaciones AS l
            JOIN sistema_usuarios AS u ON (u.elim = 0 AND u.superado = 0 AND u.did = l.quien)
            WHERE l.superado = 0 AND l.elim = 0 AND l.didQuien = ?
            AND l.autofecha BETWEEN ? AND ?
        `;

        const values = [
            userId,
            `${dateFrom} 00:00:00`,
            `${dateTo} 23:59:59`
        ];

        const rows = await executeQueryFromPool(pool, query, values);

        return rows.map(row => ({
            total: row.total * 1,
            fecha: row.fecha,
            quienLiquido: row.quienLiquido,
            did: row.did * 1
        }));
    } catch (error) {
        logRed(`Error en getSettlementList: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo liquidaciones',
            message: error.message,
            stack: error.stack
        });
    }
}