const { executeQuery, getProdDbConfig } = require("../../db");
const mysql = require('mysql');

async function crossDocking(dataQr, company) {
    let dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;
        let queryWhereId;
        const isLocal = dataQr.hasOwnProperty("local")

        if (isLocal) {
            shipmentId = dataQr.did;
            queryWhereId = ` AND e.did = ${shipmentId}`;
            if (company.did !== dataQr.didEmpresa) {
                console.log("Empresa distinta a la del envío");
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                shipmentId = resultQueryEnviosExteriores[0];
            }
        } else {
            shipmentId = dataQr["id"];
            queryWhereId = ` AND e.ml_shipment_id = ${shipmentId}`;
        }

        const queryEnvios = `SELECT e.estado_envio, e.didCliente, e.didEnvioZona, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS fecha, 
                      CONCAT(su.nombre, ' ', su.apellido) AS chofer
                      FROM envios AS e
                      LEFT JOIN sistema_usuarios AS su ON su.did = e.choferAsignado AND su.superado = 0 AND su.elim = 0
                      WHERE e.elim = 0 AND e.superado = 0${queryWhereId}`;

        const envioData = await executeQuery(dbConnection, queryEnvios, []);

        return envioData[0];
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

module.exports = crossDocking;