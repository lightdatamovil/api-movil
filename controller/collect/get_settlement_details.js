import { LightdataORM, CustomException } from "lightdata-tools";

export async function getSettlementDetails({ db, req }) {
    const { settlementId } = req.body;

    const result = await LightdataORM.select({
        dbConnection: db,
        table: "colecta_liquidaciones",
        where: { did: settlementId },
        select: "idlineas"
    });

    const idlineas = result[0]?.idlineas;

    if (!idlineas) {
        throw new CustomException({
            title: "No se encontraron detalles de la liquidación.",
            message: "No se encontró la idlineas de la liquidación."
        });
    }

    const sqlDetalle = `
        SELECT eh.didEnvio, e.ml_shipment_id, e.didCliente, c.nombre_fantasia, eh.fecha
        FROM envios_historial AS eh
        LEFT JOIN envios AS e ON e.superado = 0 AND e.elim = 0 AND e.did = eh.didEnvio
        LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente
        WHERE eh.superado = 0 AND eh.elim = 0 AND eh.id IN (?);
    `;
    const detalleResult = await db.query(sqlDetalle, [idlineas]);

    const data = detalleResult[0].map(row => ({
        didEnvio: row.didEnvio,
        ml_shipment_id: row.ml_shipment_id,
        cliente: row.nombre_fantasia,
        fecha: row.fecha
    }));

    return {
        success: true,
        data,
        message: "Detalles de la liquidación obtenidos correctamente",
        meta: { total: data.length }
    };
}
