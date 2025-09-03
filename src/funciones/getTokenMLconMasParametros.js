import axios from "axios";
import CustomException from "../../classes/custom_exception.js";

export async function getTokenMLconMasParametros(clientId, accountId, companyId) {
    const url = `https://cuentasarg.lightdata.com.ar/getTokenML.php?dc=${clientId}&dc2=${accountId}&didEmpresa=${companyId}&ventaflex=0`;

    try {
        const { data } = await axios.get(url);

        return data.trim();
    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: "Error obteniendo token",
            message: error.message,
            stack: error.stack,
        });
    }
}