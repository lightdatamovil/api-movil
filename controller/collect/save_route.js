
import { executeQuery, getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const { additionalRouteData, clients, cantidad, distancia, total_km, total_minutos, camino } = req.body;

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



    await executeQuery({ db, query: sql, values: params });

    return { message: "Ruta guardada correctamente" };
}