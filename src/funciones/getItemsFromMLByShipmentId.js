import axios from "axios";
import { logYellow } from "./logsCustom.js";

export async function getItemsFromMLByShipmentId(shipmentId, accessToken) {
    const url = `https://api-test.mercadolibre.com/shipments/${shipmentId}/items`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}
