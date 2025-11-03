import { executeQuery } from "lightdata-tools";

export async function getSettlementList({ db, req }) {
    const { userId } = req.user;
    const { from, to } = req.body;

    const dateFrom = new Date(from).toISOString().split('T')[0];
    const dateTo = new Date(to).toISOString().split('T')[0];

    const query = `
            SELECT l.did, l.total, DATE_FORMAT(l.autofecha, '%d-%m-%Y') AS fecha,
                   CONCAT(u.nombre, ' ', u.apellido) AS quienLiquido
            FROM liquidaciones AS l
            JOIN sistema_usuarios AS u ON (u.elim = 0 AND u.superado = 0 AND u.did = l.quien)
            WHERE l.superado = 0 AND l.elim = 0 AND l.didQuien = ?
            AND l.autofecha BETWEEN ? AND ?
        `;

    const values = [
        userId,
        `${dateFrom} 00:00:00`,
        `${dateTo} 23:59:59`
    ];

    const rows = await executeQuery({ dbConnection: db, query, values });

    return {
        data: rows.map(row => ({
            total: row.total * 1,
            fecha: row.fecha,
            quienLiquido: row.quienLiquido,
            did: row.did * 1
        })),
        message: "Listado de liquidaciones obtenido correctamente"
    };
}