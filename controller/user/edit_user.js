import { CustomException, executeQuery } from "lightdata-tools";

export async function editUser({ db, req }) {
    const { email, phone } = req.body;
    const { userId } = req.user;

    const querySelectUsers = `SELECT * FROM sistema_usuarios WHERE superado=0 AND elim=0 AND did = ?`;
    const resultSelectUsers = await executeQuery({ db, query: querySelectUsers, values: [userId] });

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

    const resultInsert = await executeQuery({ db, query: insertQuery, values: insertValues });
    const insertedId = resultInsert.insertId;

    const updateQuery = `UPDATE sistema_usuarios SET superado=1 WHERE superado=0 AND elim=0 AND did = ? AND id != ?`;
    await executeQuery({ db, query: updateQuery, values: [userId, insertedId] });

    return { message: "Datos insertados correctamente" };
}