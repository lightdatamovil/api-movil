import { executeQuery, poolLocal } from "../../db.js";
import { logCyan, logGreen, logRed } from "./logsCustom.js";

export async function crearLog(empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito) {
    try {
        // Si 'resultado' vino como JSON string, conviértelo a objeto
        let resultadoObj = typeof resultado === 'string'
            ? JSON.parse(resultado)
            : resultado;

        // Normaliza el endpoint (quita comillas sobrantes)
        const endpointClean = endpoint.replace(/"/g, '');

        if (endpointClean === '/company-identification') {
            resultadoObj.image = 'Imagen eliminada por logs';
        }

        const sqlLog = `
            INSERT INTO logs_v2
                (empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Siempre stringify para que el driver reciba un string
        const values = [
            empresa,
            usuario,
            perfil,
            JSON.stringify(body),
            tiempo,
            JSON.stringify(resultadoObj),
            endpointClean,
            exito ? 1 : 0
        ];

        await executeQuery(poolLocal, sqlLog, values);
        logGreen(`Log creado: ${JSON.stringify(values)}`);
    } catch (error) {
        logRed(`Error en crearLog: ${error.stack}`);
        throw error;
    }
}
