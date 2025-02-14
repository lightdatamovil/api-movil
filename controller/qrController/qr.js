const { executeQuery, getProdDbConfig, getDbConfig } = require("../../db");
const mysql = require('mysql');

async function crossDocking(dataQr, company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;
        let queryWhereId = '';
        const isLocal = dataQr.hasOwnProperty("local")

        if (isLocal) {
            shipmentId = dataQr.did;

            if (company.did != dataQr.empresa) {

                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                shipmentId = resultQueryEnviosExteriores[0];
            }
            queryWhereId = ` AND e.did = ${shipmentId}`;
        } else {
            shipmentId = dataQr.id;
            queryWhereId = ' AND e.ml_shipment_id =' + shipmentId;
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

async function getShipmentIdFromQr(dataQr, company) {
    console.log(company);
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;

        const isLocal = dataQr.hasOwnProperty("local");

        if (isLocal) {
            shipmentId = parseInt(dataQr.did);
            queryWhereId = ` AND e.did = ${shipmentId}`;
            if (company.did != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                shipmentId = resultQueryEnviosExteriores[0];
            }
        } else {
            const senderId = dataQr.sender_id;

            const query = `SELECT did FROM envios WHERE shipmentId = '${dataQr.id}' AND ml_vendedor_id = '${senderId}'`;

            const result = await executeQuery(dbConnection, query, []);

            if (result.length > 0) {
                shipmentId = result[0].did;
            }
        }

        return shipmentId;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function driversList(company) {
    const dbConfig = getProdConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        var driverList = [];

        const query = "SELECT u.did, concat( u.nombre,' ', u.apellido) as nombre FROM `sistema_usuarios` as u JOIN sistema_usuarios_accesos as a on ( a.elim=0 and a.superado=0 and a.usuario = u.did) where u.elim=0 and u.superado=0 and a.perfil=3 ORDER BY nombre ASC";

        const results = await executeQuery(dbConnection, query, []);

        for (i = 0; i < results.length; i++) {
            const row = results[i];

            const driver = {
                "id": row.did,
                "nombre": row.nombre
            }

            driverList.push(driver);
        }

        return driverList;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}
module.exports = {
    crossDocking,
    driversList,
    getShipmentIdFromQr,
};
