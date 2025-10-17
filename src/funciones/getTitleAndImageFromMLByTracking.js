import { axiosInstance } from "../../db.js";

export async function getTitleAndImageFromMLByTracking({ itemId, accessToken }) {
    const url = `https://api.mercadolibre.com/items/${itemId}/`;
    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}
