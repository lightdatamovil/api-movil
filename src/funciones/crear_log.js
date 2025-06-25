import { executeQuery, poolLocal } from "../../db.js";
import { logGreen, logRed } from "./logsCustom.js";

export async function crearLog(empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito) {
    try {
        const sqlLog = `INSERT INTO logs_v2 (empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [empresa, usuario, perfil, JSON.stringify(body), tiempo, resultado, endpoint, exito];

        await executeQuery(poolLocal, sqlLog, values);
        logGreen(`Log creado${endpoint != "/shipment-list" || endpoint != "/driver-list" || endpoint != "/company-identification" ? `: ${JSON.stringify(values)}` : " con éxito"}`);
    } catch (error) {
        logRed(`Error en crearLog: ${error.stack}`)
        throw error;
    }
}
