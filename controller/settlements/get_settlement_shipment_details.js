import { CustomException, executeQuery } from "lightdata-tools";
import { companiesService } from "../../db.js";

export async function getSettlementShipmentDetails({ db, req, company }) {
    const { shipmentId } = req.body;

    const zones = await companiesService.getZonesByCompany(db, company.did);

    const sql = `
        SELECT e.did, ce.chofer, e.estado_envio, e.flex, e.didEnvioZona,
            DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha, cl.razon_social,
            edd.cp, CONCAT(edd.address_line, ' ', edd.localidad) as direccion,
            edd.destination_comments 
        FROM envios AS e 
        LEFT JOIN costos_envios AS ce ON(ce.elim = 0 AND ce.superado = 0 AND ce.didEnvio = e.did) 
        LEFT JOIN clientes AS cl ON(cl.elim = 0 AND cl.superado = 0 AND cl.did = e.didCliente) 
        LEFT JOIN envios_direcciones_destino AS edd ON(edd.elim = 0 AND edd.superado = 0 AND edd.didEnvio = e.did) 
        WHERE e.superado = 0 AND e.elim = 0 AND e.did = ? `;

    const resultados = await executeQuery({ dbConnection: db, query: sql, values: [shipmentId] });

    if (resultados.length > 0) {
        const row = resultados[0];
        return {
            data: {
                total: row.chofer ? parseInt(row.chofer) : 0,
                didEnvio: parseInt(row.did),
                direccion: row.direccion || "",
                vendedor: row.razon_social || "",
                estado: parseInt(row.estado_envio),
                fecha: row.fecha || "",
                tracking: "test01",
                origen: parseInt(row.flex),
                zona: zones[row.didEnvioZona] || "Zona no encontrada",
                cp: row.cp || "",
                obs: row.destination_comments || ""
            }, message: 'Detalle de envíos de liquidación obtenido correctamente'
        };
    } else {
        throw new CustomException({
            title: 'Error en liquidación',
            message: 'No se encontró el envío',
        });
    }
}
