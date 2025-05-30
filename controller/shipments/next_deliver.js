import { executeQuery, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function nextDeliver(company, shipmentId, dateYYYYMMDD, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const query = "INSERT INTO proximas_entregas (didEnvio, fecha, quien) VALUES (?, ?, ?)";

        await executeQuery(dbConnection, query, [shipmentId, dateYYYYMMDD, userId]);
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
    } finally {
        dbConnection.end();
    }
}