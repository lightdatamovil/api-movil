import axios from "axios";

export async function getOrderFromML(orderId, accessToken) {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
}