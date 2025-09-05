import { executeQuery, getFechaConHoraLocalDePais } from 'lightdata-tools';

export async function finishRoute(dbConnection, req) {
    const { company, userId } = req.user;

    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];

    const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo, desde) VALUES (?, ?,?)";
    await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 1, 3]);

    const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
    await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);

}