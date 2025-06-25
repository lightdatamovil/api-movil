import axios from "axios";

export async function getShipmentFromMLByTracking(shipmentId, accessToken) {
    if (!shipmentId || !accessToken) {
        throw new Error("Shipment ID and access token are required.");
    }

    const url = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}

export async function getTitleAndImageFromMLByTracking(itemId, accessToken) {
    const url = `https://api.mercadolibre.com/items/${itemId}/`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}
