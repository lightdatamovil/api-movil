import { CustomException, executeQuery } from "lightdata-tools";
import { createHash } from "crypto";

export async function changePassword({ db, req }) {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.user;
    const oldPasswordHash = createHash('sha256').update(oldPassword).digest('hex');
    const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');
    const querySelectUsers = `SELECT * FROM sistema_usuarios WHERE superado = 0 AND elim = 0 AND did = ? `;
    const resultSelectUsers = await executeQuery({ dbConnection: db, query: querySelectUsers, values: [userId] });

    if (resultSelectUsers.length === 0) {
        throw new CustomException({
            title: 'Error cambiando contraseña',
            message: 'Usuario no encontrado',
        });
    }

    const userData = resultSelectUsers[0];

    if (oldPasswordHash !== userData.pass) {
        throw new CustomException({
            title: 'Error cambiando contraseña',
            message: 'La contraseña actual no es correcta',
        });
    }

    if (oldPasswordHash === newPasswordHash) {
        throw new CustomException({
            title: 'Error cambiando contraseña',
            message: 'La nueva contraseña no puede ser igual a la anterior',
        });

    }

    const insertQuery = `INSERT INTO sistema_usuarios
            (did, nombre, apellido, email, usuario, pass, bloqueado, imagen, fecha_inicio, empresa, sucursal, creado_por, habilitado, telefono, color_mapa, quien, identificador, direccion, inicio_ruta, lista_de_precios) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertValues = [
        userData.did, userData.nombre, userData.apellido, userData.email, userData.usuario, newPasswordHash,
        userData.bloqueado, userData.imagen, userData.fecha_inicio, userData.empresa, userData.sucursal,
        userData.creado_por, userData.habilitado, userData.telefono, userData.color_mapa, userData.quien,
        userData.identificador, userData.direccion, userData.inicio_ruta, userData.lista_de_precios
    ];

    const resultInsert = await executeQuery({ dbConnection: db, query: insertQuery, values: insertValues });
    const insertedId = resultInsert.insertId;

    const updateQuery = `UPDATE sistema_usuarios SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? AND id != ? `;
    await executeQuery({ dbConnection: db, query: updateQuery, values: [userId, insertedId] });

    return { message: "Datos insertados correctamente" };

}