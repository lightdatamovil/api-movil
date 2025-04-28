import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from 'mysql';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function editUser(company, userId, email, phone) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const querySelectUsers = `SELECT * FROM sistema_usuarios WHERE superado=0 AND elim=0 AND did = ?`;
        const resultSelectUsers = await executeQuery(dbConnection, querySelectUsers, [userId]);

        if (resultSelectUsers.length === 0) {
            throw new CustomException({
                title: 'Error editando usuario',
                message: 'Usuario no encontrado',
            });
        }

        const userData = resultSelectUsers[0];

        const insertQuery = `INSERT INTO sistema_usuarios 
            (did, nombre, apellido, email, usuario, pass, bloqueado, imagen, fecha_inicio, empresa, sucursal, creado_por, habilitado, telefono, color_mapa, quien, identificador, direccion, inicio_ruta, lista_de_precios) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [
            userData.did, userData.nombre, userData.apellido, email, userData.usuario, userData.pass,
            userData.bloqueado, userData.imagen, userData.fecha_inicio, userData.empresa, userData.sucursal,
            userData.creado_por, userData.habilitado, phone, userData.color_mapa, userData.quien,
            userData.identificador, userData.direccion, userData.inicio_ruta, userData.lista_de_precios
        ];

        const resultInsert = await executeQuery(dbConnection, insertQuery, insertValues);
        const insertedId = resultInsert.insertId;

        const updateQuery = `UPDATE sistema_usuarios SET superado=1 WHERE superado=0 AND elim=0 AND did = ? AND id != ?`;
        await executeQuery(dbConnection, updateQuery, [userId, insertedId]);

        return;
    } catch (error) {
        logRed(`Error en editUser: ${error.stack}`);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error editando usuario',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}