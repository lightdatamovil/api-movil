import { LightdataORM } from "lightdata-tools";

export async function geolocalize({ db, req }) {
    const { shipmentId, latitude, longitude } = req.body;

    await LightdataORM.select({
        table: "envios",
        where: { did: shipmentId },
        dbConnection: db,
        select: ['did'],
        throwIfNotExists: true,
    });

    await LightdataORM.update({
        table: "envios",
        data: {
            destination_latitude: latitude,
            destination_longitude: longitude
        },
        where: { did: shipmentId },
        dbConnection: db
    });

    await LightdataORM.update({
        table: "envios_direcciones_destino",
        data: {
            latitud: latitude,
            longitud: longitude
        },
        where: { didEnvio: shipmentId },
        dbConnection: db
    });

    return { message: "Geolocalización registrada correctamente" };

}