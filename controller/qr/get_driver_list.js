import { executeQuery, getDbConfig } from "../../db.js";
import mysql2 from 'mysql';
import { logRed } from "../../src/funciones/logsCustom.js";

export async function driverList(company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        var driverList = [];

        const query = `
            SELECT u.did, concat(u.nombre, ' ', u.apellido) as nombre
            FROM sistema_usuarios as u
            where u.elim = 0 and u.superado = 0 and u.perfil IN(3, 6)
            ORDER BY nombre ASC
            `;

        const results = await executeQuery(dbConnection, query, []);

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            const driver = {
                "id": row.did,
                "nombre": row.nombre
            }

            driverList.push(driver);
        }

        return driverList;
    } catch (error) {
        logRed(`Error en driverList: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}