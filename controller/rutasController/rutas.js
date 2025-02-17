import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../../db.js';

export async function verifyStartedRoute(company, userId) {
    let dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${userId} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        const resultQueryCadetesMovimientos = await executeQuery(dbConnection, sqlCadetesMovimientos, [userId]);

        let startedRoute = resultQueryCadetesMovimientos.length > 0 ? true : false;

        return startedRoute ? true : false;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}