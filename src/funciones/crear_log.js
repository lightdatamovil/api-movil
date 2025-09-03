import { executeQuery, poolLocal } from "../../db.js";

export async function crearLog(req, tiempo, resultado, exito) {
    const { empresa, usuario, perfil } = req.body;
    // Si 'resultado' vino como JSON string, conviértelo a objeto
    let resultadoObj = typeof resultado === 'string'
        ? JSON.parse(resultado)
        : resultado;
    let bodyObj = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    // Normaliza el endpoint (quita comillas sobrantes)
    const endpointClean = req.url.replace(/"/g, '');

    if (endpointClean === '/company-identification' && exito == 1) {
        resultadoObj.image = 'Imagen eliminada por logs';
    }
    if (endpointClean === '/upload-image' || endpointClean === '/change-profile-picture') {
        bodyObj.image = 'Imagen eliminada por logs';
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
        JSON.stringify(bodyObj),
        tiempo,
        JSON.stringify(resultadoObj),
        endpointClean,
        exito ? 1 : 0
    ];

    await executeQuery(poolLocal, sqlLog, values);
}
