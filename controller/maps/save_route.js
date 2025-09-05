import { executeQuery, getFechaLocalDePais } from 'lightdata-tools';

export async function saveRoute(dbConnection, req, company) {
    const { userId } = req.user;
    const { orders, distance, totalDelay, additionalRouteData } = req.body;
    let routeId = 0;

    const rows = await executeQuery(dbConnection, "SELECT did FROM `ruteo` WHERE superado = 0 AND elim = 0 AND didChofer = ?", [userId]);
    if (rows.length > 0) {
        routeId = rows[0].did;
    }

    if (routeId !== 0) {
        await executeQuery(dbConnection, "UPDATE `ruteo` SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?", [routeId]);
        // TODO: Verificar si es necesario actualizar las paradas
        // await executeQuery(dbConnection, "UPDATE `ruteo_paradas` SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuteo = ?", [routeId]);
    }
    const dateConHora = getFechaLocalDePais(company.pais);
    // TODO: Que significa este 2??
    const result = await executeQuery(
        dbConnection,
        "INSERT INTO ruteo (desde, fecha, fechaOperativa, didChofer, distancia, tiempo, quien, dataDeRuta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [2, dateConHora, dateConHora, userId, distance, totalDelay, userId, JSON.stringify(additionalRouteData)]
    );

    const newId = result.insertId;

    const querySetDid = "UPDATE ruteo SET did = ? WHERE superado=0 AND elim=0 AND id = ? LIMIT 1";
    await executeQuery(dbConnection, querySetDid, [newId, newId]);

    for (const order of orders) {
        const { index, shipmentId, arrivalTime } = order;

        await executeQuery(
            dbConnection,
            "INSERT INTO ruteo_paradas (didRuteo, tipoParada, didPaquete, retira, didCliente, didDireccion, orden, hora_llegada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [newId, 1, shipmentId, 0, 0, 0, index, arrivalTime]
        );
    }

    return { message: "Ruta guardada correctamente" };
}