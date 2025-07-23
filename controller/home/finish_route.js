import { getProdDbConfig, executeQuery } from '../../db.js';
import mysql2 from 'mysql2';
import CustomException from '../../classes/custom_exception.js';
import { getFechaConHoraLocalDePais } from '../../src/funciones/getFechaConHoraLocalByPais.js';

export async function finishRoute(company, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];

    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo, desde) VALUES (?, ?,?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 1, 3]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
        await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);
    } catch (error) {
        logRed(`Error en finishRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error finalizando ruta',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}