import axios from "axios";

export async function getTokenMLconMasParametros(clientId, accountId, companyId) {
    const url = `https://cuentasarg.lightdata.com.ar/getTokenML.php?dc=${clientId}&dc2=${accountId}&didEmpresa=${companyId}&ventaflex=0`;

    const { data } = await axios.get(url);

    return data.trim();
}