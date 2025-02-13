


const mysql = require('mysql');
async function crearLog(idEmpresa, operador, endpoint, result, quien, idDispositivo, modelo, marca, versionAndroid, versionApp) {
    const dbConfig = {
        host: "localhost",
        user: "apimovil_ulog",
        password: "}atbYkG0P,VS",
        database: "apimovil_log"
    };
    const dbConnection = mysql.createConnection(dbConfig);

    return new Promise((resolve, reject) => {
        dbConnection.connect((err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err.stack);
                return reject({ error: "error", details: err.message });
            }

            const sql = `
                INSERT INTO logs (empresa, operador, request, response, quien, dispositivo, uid, appversion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                idEmpresa,
                operador,
                endpoint,
                JSON.stringify(result),
                quien,
                `${modelo} ${marca} ${versionAndroid}`,
                idDispositivo,
                versionApp
            ];

            const queryString = mysql.format(sql, values);
            console.log("QUERY A EJECUTAR:", queryString);

            dbConnection.query(sql, values, (err, results) => {
                dbConnection.end();
                if (err) {
                    console.error('Error al ejecutar la consulta de logs:', err.stack);
                    return reject({ error: "error", details: err.message, query: queryString });
                } else {
                    return resolve({ error: "no error", results: results, query: queryString });
                }
            });
        });
    });
}
module.exports = crearLog;