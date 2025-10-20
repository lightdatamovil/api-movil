import { axiosInstance } from "../../../db.js";

export async function getShipmentDetails(shipmentId, token) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
}