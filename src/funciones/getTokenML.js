import { axiosInstance } from "../../db.js";

export async function getToken(sellerid) {
    const dia = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://cuentasarg.lightdata.com.ar/getToken.php?seller_id=${sellerid}&tk=${dia}`;

    const response = await axiosInstance.get(url);

    return response.data[sellerid];
}