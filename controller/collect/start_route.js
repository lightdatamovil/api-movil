import mysql2 from 'mysql2';
import { getProdDbConfig } from '../../db.js';
import CustomException from '../../classes/custom_exception.js';

export async function startCollectRoute(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    try {

        return true;
    } catch (error) {
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