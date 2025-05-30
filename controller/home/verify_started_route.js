import mysql2 from 'mysql2';
import { getProdDbConfig, executeQuery } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';

export async function verifyStartedRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ? AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        const resultQueryCadetesMovimientos = await executeQuery(dbConnection, sqlCadetesMovimientos, [userId]);

        if (resultQueryCadetesMovimientos.length === 0) {
            return false;
        }

        return resultQueryCadetesMovimientos[0].tipo == 0;
    } catch (error) {
        logRed(`Error en verifyStartedRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error verificando ruta',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}