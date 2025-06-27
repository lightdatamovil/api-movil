import mysql2 from 'mysql2';
import { executeQuery, getProdDbConfig } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function getCollectDetails(company, dateYYYYMMDD, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const clientesResult = await executeQuery(
            dbConnection,
            "SELECT did, nombre_fantasia FROM clientes WHERE superado=0 AND elim=0"
        );

        let Aclientes = {};

        clientesResult.forEach(row => {
            Aclientes[row.did] = row.nombre_fantasia;
        });

        const enviosResult = await executeQuery(
            dbConnection,
            `SELECT didCliente, didEnvio 
             FROM colecta_asignacion 
             WHERE superado = 0 AND elim = 0 AND didChofer = ? AND fecha = ? `,
            [userId, dateYYYYMMDD]
        );

        let collectDetails = {};

        enviosResult.forEach(row => {
            if (!collectDetails[row.didCliente]) {
                collectDetails[row.didCliente] = {
                    nombre_fantasia: Aclientes[row.didCliente] || "Cliente desconocido",
                    total: 0
                };
            }
            collectDetails[row.didCliente].total += 1;
        });

        let respuesta = Object.entries(collectDetails).map(([id, data]) => ({
            id,
            ...data
        }));

        return respuesta;
    } catch (error) {
        logRed(`Error en getCollectDetails: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en obtener detalles de colecta.',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}