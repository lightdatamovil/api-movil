import { axiosInstance } from "../../db.js";

export async function getShipmentFromMLByTracking({ shipmentId, accessToken }) {
    if (!shipmentId || !accessToken) {
        throw new Error("Shipment ID and access token are required.");
    }

    const url = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}
