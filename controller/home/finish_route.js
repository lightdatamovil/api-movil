export async function finishRoute(company, userId, dateYYYYMMDD) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const hour = dateYYYYMMDD.split(' ')[1];

    try {
        const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo) VALUES (?, ?)";
        await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 1]);

        const sqlUpdateRuteo = "UPDATE ruteo SET hs_finApp = ? WHERE superado = 0 AND elim = 0 AND didChofer = ?";
        await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);
    } catch (error) {
        logRed(`Error en finishRoute: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error finalizando ruta',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}