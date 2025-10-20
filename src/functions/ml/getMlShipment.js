import { axiosInstance } from "../../../db.js";

export async function getMlShipment(token, shipmentId) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    const { data } = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return data;
}
