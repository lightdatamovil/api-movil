import { axiosInstance } from "../../../db.js";

export async function getItemData(iditem, token) {
    const url = `https://api.mercadolibre.com/items/${iditem}?access_token=${token}`;
    const response = await axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

