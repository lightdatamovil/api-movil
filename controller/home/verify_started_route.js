import { executeQuery } from "lightdata-tools";

export async function verifyStartedRoute(dbConnection, req) {
    const { userId } = req.user;

    const sqlCadetesMovimientos = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ? AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

    const resultQueryCadetesMovimientos = await executeQuery(dbConnection, sqlCadetesMovimientos, [userId]);

    if (resultQueryCadetesMovimientos.length === 0) {
        return false;
    }
    const result = resultQueryCadetesMovimientos[0].tipo == 0;
    return {
        body: result,
        message: `La ruta ${result ? "ha comenzado" : "no ha comenzado"}`,
    };
}