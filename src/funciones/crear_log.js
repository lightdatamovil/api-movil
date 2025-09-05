import { getHeaders } from "lightdata-tools";
import { executeQuery, poolLocal } from "../../db.js";

export async function crearLog(req, tiempo, resultado, exito) {
    const { companyId, userId, profile } = req.user;
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
    const { appVersion, androidVersion, model, deviceId, brand } = getHeaders(req);
    bodyObj.appVersion = appVersion;
    bodyObj.androidVersion = androidVersion;
    bodyObj.model = model;
    bodyObj.deviceId = deviceId;
    bodyObj.brand = brand;

    const sqlLog = `
            INSERT INTO logs_v2
                (empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    // Siempre stringify para que el driver reciba un string
    const values = [
        companyId,
        userId,
        profile,
        JSON.stringify(bodyObj),
        tiempo,
        JSON.stringify(resultadoObj),
        endpointClean,
        exito ? 1 : 0
    ];

    await executeQuery(poolLocal, sqlLog, values);
}
