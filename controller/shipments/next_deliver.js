import { executeQuery, getFechaConHoraLocalDePais } from "lightdata-tools";

export async function nextDeliver(dbConnection, req, company) {
    const { shipmentId } = req.body;
    const { userId } = req.user;

    const date = getFechaConHoraLocalDePais(company.pais);
    const query = "INSERT INTO proximas_entregas (didEnvio, fecha, quien) VALUES (?, ?, ?)";

    await executeQuery(dbConnection, query, [shipmentId, date, userId]);
    return { body: true, message: "Datos obtenidos correctamente" }
}