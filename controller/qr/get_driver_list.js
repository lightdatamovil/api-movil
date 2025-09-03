import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';

export async function driverList(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        var driverList = [];

        const query = `
            SELECT u.did, concat(u.nombre, ' ', u.apellido) as nombre
            FROM sistema_usuarios as u JOIN sistema_usuarios_accesos as a on(a.elim = 0 and a.superado = 0 and a.usuario = u.did)
            where u.elim = 0 and u.superado = 0 and a.perfil IN(3, 6)
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
        throw error;
    } finally {
        dbConnection.end();
    }
}