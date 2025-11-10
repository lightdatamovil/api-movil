
import { getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const { additionalRouteData, clientsWithWarehouse, cantidad, distancia, total_km, total_minutos, camino } = req.body;

    const date = getFechaLocalDePais(company.pais);

    const [didRuta] = await LightdataORM.insert({
        db,
        table: "colecta_ruta",
        data: {
            desde: 2,
            fechaOperativa: date,
            didChofer: userId,
            fecha: date,
            cantidad,
            distancia,
            terminada: 0,
            total_km,
            total_minutos,
            dataRuta: JSON.stringify(additionalRouteData),
            quien: userId,
            camino: JSON.stringify(camino)
        },
        quien: userId,
    });

    await LightdataORM.insert({
        db,
        table: "colecta_ruta_paradas",
        data: clientsWithWarehouse.map((client) => ({
            didRuta,
            didCliente: client.didCliente,
            didDeposito: client.didDeposito,
            orden: client.orden,
            demora: client.demora
        })),
        quien: userId,
    });

    return { message: "Ruta guardada correctamente" };
}