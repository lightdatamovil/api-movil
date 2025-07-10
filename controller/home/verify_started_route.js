import { connectionsPools, executeQueryFromPool } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function verifyStartedRoute(companyId, userId) {
    const pool = connectionsPools[companyId];

    try {
        const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ? AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        const resultQueryCadetesMovimientos = await executeQueryFromPool(pool, sqlCadetesMovimientos, [userId]);

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
    }
}