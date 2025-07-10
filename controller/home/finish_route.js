import { connectionsPools, executeQueryFromPool } from '../../db.js';
import CustomException from '../../classes/custom_exception.js';
import { logRed } from '../../src/funciones/logsCustom.js';

export async function finishRoute(companyId, userId, dateYYYYMMDD) {
    const pool = connectionsPools[companyId];

    const hour = dateYYYYMMDD.split(' ')[1];

    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo, desde) VALUES (?, ?,?)";
        await executeQueryFromPool(pool, sqlInsertMovimiento, [userId, 1, 3]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
        await executeQueryFromPool(pool, sqlUpdateRuteo, [hour, userId]);
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
    }
}