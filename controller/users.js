import { getProdDbConfig, executeQuery } from "../db.js";
import mysql from 'mysql';
import imageType from 'image-type';
import axios from 'axios';

export async function editUser(company, userId, email, phone) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const querySelectUsers = `SELECT * FROM sistema_usuarios WHERE superado=0 AND elim=0 AND did = ?`;
        const resultSelectUsers = await executeQuery(dbConnection, querySelectUsers, [userId]);

        if (resultSelectUsers.length === 0) {
            throw new Error("Usuario no encontrado");
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
        console.error("Error en editUser:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function changePassword(company, userId, oldPassword, newPassword) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const querySelectUsers = `SELECT * FROM sistema_usuarios WHERE superado=0 AND elim=0 AND did = ?`;
        const resultSelectUsers = await executeQuery(dbConnection, querySelectUsers, [userId]);

        if (resultSelectUsers.length === 0) {
            throw new Error("Usuario no encontrado");
        }

        const userData = resultSelectUsers[0];

        if (oldPassword !== userData.pass) {
            throw new Error("Las contraseñas no coinciden");
        }

        if (oldPassword === newPassword) {
            throw new Error("La nueva contraseña no puede ser igual a la anterior");
        }

        const insertQuery = `INSERT INTO sistema_usuarios 
            (did, nombre, apellido, email, usuario, pass, bloqueado, imagen, fecha_inicio, empresa, sucursal, creado_por, habilitado, telefono, color_mapa, quien, identificador, direccion, inicio_ruta, lista_de_precios) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [
            userData.did, userData.nombre, userData.apellido, userData.email, userData.usuario, newPassword,
            userData.bloqueado, userData.imagen, userData.fecha_inicio, userData.empresa, userData.sucursal,
            userData.creado_por, userData.habilitado, userData.telefono, userData.color_mapa, userData.quien,
            userData.identificador, userData.direccion, userData.inicio_ruta, userData.lista_de_precios
        ];

        const resultInsert = await executeQuery(dbConnection, insertQuery, insertValues);
        const insertedId = resultInsert.insertId;

        const updateQuery = `UPDATE sistema_usuarios SET superado=1 WHERE superado=0 AND elim=0 AND did = ? AND id != ?`;
        await executeQuery(dbConnection, updateQuery, [userId, insertedId]);

        return;
    } catch (error) {
        console.error("Error en changePassword:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function changeProfilePicture(company, userId, profile, image) {

    if (image && image !== "") {
        const imageB64 = image.split(",");

        const decodedData = Buffer.from(imageB64[1], 'base64');

        const imageType = await getImageType(decodedData);

        if (imageType) {
            const data = {
                operador: "guardarImagen",
                didempresa: company.did,
                didUser: userId,
                perfil: profile,
                imagen: image,
                token: new Date().toISOString().split('T')[0].replace(/-/g, '') // "Ymd" format
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post('https://files.lightdata.app/upload_perfil.php', data, config)

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } else {
            throw new Error("Tipo de imagen no soportado");
        }
    }
}

async function getImageType(buffer) {
    const type = await imageType(buffer);
    return type ? type.mime : null;
}