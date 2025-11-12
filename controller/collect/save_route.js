
import { getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const { additionalRouteData, clientsWithWarehouse, cantidad, distancia, total_km, total_minutos, camino } = req.body;

    const date = getFechaLocalDePais(company.pais);

    const ruta = await LightdataORM.upsert({
        db,
        table: "colecta_ruta",
        where: { fecha: date, didChofer: userId },
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
        returnRow: true,
        returnSelect: "did",
        quien: userId,
        log: true
    });
    console.log("Ruta guardada con ID:", ruta.did);
    await LightdataORM.upsert({
        db,
        table: "colecta_ruta_paradas",
        where: { didRuta: ruta.did },   // encuentra todas las paradas vigentes de esa ruta
        data: clientsWithWarehouse.map(c => ({
            didRuta: ruta.did,
            didCliente: c.didCliente,
            didDeposito: c.didDeposito,
            orden: c.orden,
            demora: c.ordenLlegada,
            quien: userId,
        })),
        quien: userId,
        onlyReinsertProvided: true,      // ⬅️ no reinsertar las que ya no vienen en data
    });

    return { message: "Ruta guardada correctamente" };
}