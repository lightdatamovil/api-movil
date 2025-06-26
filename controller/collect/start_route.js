import { connectionsPools } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function startCollectRoute(companyId) {
    const pool = connectionsPools[companyId];
    try {

        return true;
    } catch (error) {
        logRed(`Error en startCollectRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en iniciar la recolección de ruta.',
            message: error.message,
            stack: error.stack
        });
    }
}