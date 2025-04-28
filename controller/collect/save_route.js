import mysql2 from 'mysql';
import { getProdDbConfig } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function saveRoute(company, dateYYYYMMDD, userId, additionalRouteData, orders) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let didAsuperar = 0;

        const rows = await executeQuery(
            dbConnection,
            "SELECT did FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND didChofer = ?",
            [userId]
        );

        if (rows.length == 0) {
            throw new CustomException({
                title: 'Error en guardar ruta.',
                message: 'No se encontró una ruta para superar.',
            });
        }

        didAsuperar = rows[0].did;

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1",
            [didAsuperar]
        );

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta_paradas SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuta = ?",
            [didAsuperar]
        );

        const result = await executeQuery(
            dbConnection,
            "INSERT INTO colecta_ruta (desde, fecha, fechaOperativa, didChofer, quien, dataRuta) VALUES (?, ?, ?, ?, ?, ?)",
            [2, dateYYYYMMDD, dateYYYYMMDD, userId, userId, JSON.stringify(additionalRouteData)]
        );

        const newId = result.insertId;

        if (orders.length === 0) {
            throw new CustomException({
                title: 'Error en guardar ruta.',
                message: 'No se encontraron paradas para la ruta.',
            });
        }

        const insertParadas = orders.map(({ orden, cliente, ordenLlegada }) =>
            executeQuery(
                dbConnection,
                "INSERT INTO colecta_ruta_paradas (didRuta, didCliente, orden, demora, fecha_colectado, quien) VALUES (?, ?, ?, ?, ?, ?)",
                [newId, cliente, orden, ordenLlegada, dateYYYYMMDD, userId]
            )
        );

        await Promise.all(insertParadas);

        return;
    } catch (error) {
        logRed(`Error en saveRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en guardar ruta.',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}