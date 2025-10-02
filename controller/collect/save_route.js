
import { executeQuery, getFechaLocalDePais } from 'lightdata-tools';

export async function saveRoute(dbConnection, req, company) {
    const { userId } = req.user;
    const { additionalRouteData, clients, cantidad, distancia, total_km, total_minutos } = req.body;

    const date = getFechaLocalDePais(company.pais);

    let didAsuperar = 0;

    const rows = await executeQuery(
        dbConnection,
        "SELECT did FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND didChofer = ?",
        [userId]
    );

    if (rows.length == 0) {
        const queryInsert = `INSERT INTO colecta_ruta (desde, fechaOperativa, didChofer, fecha, cantidad, distancia, total_km, total_minutos, dataRuta, quien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const result = await executeQuery(
            dbConnection,
            queryInsert,
            [2, date, userId, date, cantidad, distancia, total_km, total_minutos, JSON.stringify(additionalRouteData), userId]
        );
        didAsuperar = result.insertId;

        const updateQuery = `UPDATE colecta_ruta SET did = ? WHERE id = ?`;
        await executeQuery(dbConnection, updateQuery, [didAsuperar, didAsuperar]);
    } else {
        didAsuperar = rows[0].did;

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1",
            [didAsuperar]
        );

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta_paradas SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuta = ?",
            [didAsuperar]
        );
        //* EL 2 SIGNIFICA APP
        await executeQuery(
            dbConnection,
            "INSERT INTO colecta_ruta (desde, fechaOperativa, didChofer, fecha, cantidad, distancia, total_km, total_minutos, dataRuta, quien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [2, date, userId, date, cantidad, distancia, total_km, total_minutos, JSON.stringify(additionalRouteData), userId]
        );
    }

    const values = clients.map(({ orden, cliente, ordenLlegada }) =>
        [didAsuperar, cliente, orden, ordenLlegada, date, userId]
    );

    const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");

    const sql = `
    INSERT INTO colecta_ruta_paradas 
        (didRuta, didCliente, orden, demora, fecha_colectado, quien) 
    VALUES ${placeholders}
    `;

    const params = values.flat();

    await executeQuery(dbConnection, sql, params);

    return { message: "Ruta guardada correctamente" };
}