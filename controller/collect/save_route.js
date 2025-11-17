import { getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const {
        additionalRouteData,
        clientsWithWarehouse,
        cantidad,
        distancia,
        total_km,
        total_minutos,
        camino
    } = req.body;

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
            camino: JSON.stringify(camino),
        },
        returnRow: true,
        returnSelect: "did",
        quien: userId,
    });

    await LightdataORM.update({
        db,
        table: "colecta_ruta_paradas",
        where: { didRuta: ruta.did },
        versionKey: "didRuta",
        data: { superado: 1 },
        throwIfNotExists: false,
        quien: userId,
    });

    await LightdataORM.insert({
        db,
        table: "colecta_ruta_paradas",
        data: clientsWithWarehouse.map(client => ({
            didRuta: ruta.did,
            didCliente: client.didCliente,
            didDeposito: client.didDeposito,
            orden: client.orden,
            demora: client.ordenLlegada,
        })),
        quien: userId,
    });

    return { message: "Ruta guardada correctamente" };
}
