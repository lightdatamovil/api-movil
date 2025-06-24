import { connectionsPools, executeQuery, executeQueryFromPool, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function nextDeliver(company, shipmentId, dateYYYYMMDD, userId) {
    const pool = connectionsPools[company.did];

    try {
        const query = "INSERT INTO proximas_entregas (didEnvio, fecha, quien) VALUES (?, ?, ?)";

        await executeQueryFromPool(pool, query, [shipmentId, dateYYYYMMDD, userId]);
    } catch (error) {
        logRed(`Error en nextDeliver: ${error.stack} `);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en próxima entrega',
            message: error.message,
            stack: error.stack
        });
    }
}