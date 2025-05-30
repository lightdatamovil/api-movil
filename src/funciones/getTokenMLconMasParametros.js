import axios from "axios";
import { logRed } from "./logsCustom.js";

export async function getTokenMLconMasParametros(clientId, accountId, companyId) {
    const url = `https://cuentasarg.lightdata.com.ar/getTokenML.php?dc=${clientId}&dc2=${accountId}&didEmpresa=${companyId}&ventaflex=0`;

    try {
        const { data } = await axios.get(url);

        return data.trim();
    } catch (error) {
        logRed(`Error obteniendo token: ${error.stack}`);

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