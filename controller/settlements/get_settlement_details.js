import { CustomException, executeQuery } from "lightdata-tools";
import { companiesService } from "../../db.js";

export async function getSettlementDetails(dbConnection, req, company) {
    const { settlementId } = req.body;
    const zones = await companiesService.getZonesByCompany(company.did);

    const queryLines = "SELECT idlineas FROM liquidaciones WHERE superado=0 AND elim=0 AND did = ?";

    const resultQueryLine = await executeQuery({ dbConnection, query: queryLines, values: [settlementId] });

    if (resultQueryLine.length === 0) {
        throw new CustomException({
            title: 'Error en liquidación',
            message: 'No se encontró la liquidación',
        });
    }

    const idLine = resultQueryLine.length > 0 ? resultQueryLine[0].idlineas : "";

    const sql = `SELECT e.ml_shipment_id, e.didEnvioZona, e.flex, ce.chofer, e.did,
            DATE_FORMAT(eh.fecha, '%d/%m/%Y') as fecha, eh.estado
                 FROM envios_historial AS eh 
                 JOIN envios AS e ON e.elim = 0 AND e.superado = 0 AND e.did = eh.didEnvio
                 JOIN costos_envios AS ce ON ce.elim = 0 AND ce.superado = 0 AND ce.didEnvio = e.did
                 WHERE eh.id IN(${idLine})`;

    const results = await executeQuery({ dbConnection, query: sql });

    return {
        data: results.map(row => ({
            total: row.chofer * 1,
            didEnvio: row.did * 1,
            estado: row.estado * 1,
            fecha: row.fecha,
            tracking: row.ml_shipment_id,
            zona: zones[row.didEnvioZona] || "Zona desconocida"
        })),
        message: "Detalle de liquidación obtenido correctamente"
    };
}