const mysql = require('mysql');
const { getDbConfig } = require('../../db');
const executeQuery = require('../../db').executeQuery;

async function verifyStartedRoute(company) {
    let dbConfig = getDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${userId} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        const resultQueryCadetesMovimientos = await executeQuery(dbConnection, sqlCadetesMovimientos, [shipmentId, userId]);

        let startedRoute = resultQueryCadetesMovimientos.length > 0 ? true : false;

        return startedRoute;

    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}
module.exports = {
    verifyStartedRoute,
};