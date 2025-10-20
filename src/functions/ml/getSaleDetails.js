import { axiosInstance } from "../../../db.js";

export async function getSaleDetails(idventa, token) {
    const url = `https://api.mercadolibre.com/orders/${idventa}?access_token=${token}`;
    const response = await axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}