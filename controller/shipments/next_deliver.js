import { getFechaConHoraLocalDePais, LightdataORM } from "lightdata-tools";

export async function nextDeliver({ db, req, company }) {
    const { shipmentId } = req.body;
    const { userId } = req.user;

    const date = getFechaConHoraLocalDePais(company.pais);

    await LightdataORM.insert({
        dbConnection: db,
        table: "proximas_entregas",
        data: {
            didEnvio: shipmentId,
            fecha: date,
        },
        quien: userId
    })

    return { body: true, message: "Datos obtenidos correctamente" }
}