import { CustomException, executeQuery } from "lightdata-tools";

export async function geolocalize(dbConnection, req) {
    const { shipmentId, latitude, longitude } = req.body;
    const queryShipment = `SELECT did FROM envios WHERE did = ${shipmentId}`;

    const resultQuery = await executeQuery(dbConnection, queryShipment);

    if (resultQuery.length > 0) {

        const queryUpdateShipment = `UPDATE envios SET destination_latitude = ${latitude}, destination_longitude = ${longitude}  WHERE did = ${shipmentId}`;

        await executeQuery(dbConnection, queryUpdateShipment);

        const queryUpdateAddress = `UPDATE envios_direcciones_destino SET latitud = ${latitude}, longitud = ${longitude}  WHERE didEnvio = ${shipmentId}`;

        await executeQuery(dbConnection, queryUpdateAddress);

        return { message: "Geolocalización registrada correctamente" };
    } else {
        throw new CustomException({
            title: 'Error geolocalizando',
            message: 'El envío no existe',
        });
    }
}