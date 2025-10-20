import { axiosInstance } from "../../../db.js";

export async function getOrderFromML({ orderId, accessToken }) {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;
    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
}