import { getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute(dbConnection, req, company) {
    const { userId } = req.user;
    let { orders, distance, totalDelay, additionalRouteData } = req.body;

    const dateConHora = getFechaLocalDePais(company.pais);
    if (company.did == 4) {
        distance = Math.round((distance / 1000) * 100) / 100;
    }

    const [newId] = await LightdataORM.insert({
        table: "ruteo",
        values: {
            desde: 2,
            fecha: dateConHora,
            fechaOperativa: dateConHora,
            didChofer: userId,
            distancia: distance,
            tiempo: totalDelay,
            quien: userId,
            dataDeRuta: JSON.stringify(additionalRouteData)
        },
        dbConnection
    });

    await LightdataORM.insert({
        table: "ruteo_paradas",
        values: orders.map(order => ({
            didRuteo: newId,
            tipoParada: 1,
            didPaquete: order.shipmentId,
            retira: 0,
            didCliente: 0,
            didDireccion: 0,
            orden: order.index,
            hora_llegada: order.arrivalTime
        })),
        dbConnection
    });

    return { message: "Ruta guardada correctamente" };
}