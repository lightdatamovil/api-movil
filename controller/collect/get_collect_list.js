import { executeQuery } from 'lightdata-tools';

export async function getCollectList(dbConnection, req) {
    const { userId } = req.user;
    const { from, to } = req.body;
    const query = `
            SELECT fecha, COUNT(didEnvio) as total 
            FROM colecta_asignacion 
            WHERE superado = 0 AND didChofer = ? AND elim = 0 AND fecha BETWEEN ? AND ?
            GROUP BY fecha
            `;

    const results = await executeQuery(dbConnection, query, [userId, from, to]);

    const collectList = results.map(row => ({ fecha: row.fecha, total: row.total }));

    return { body: collectList, message: "Listado de colectas obtenido correctamente" };
}