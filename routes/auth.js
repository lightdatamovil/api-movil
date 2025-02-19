import { Router } from 'express';
import { getCompanyById, getCompanyByCode } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import { login, identification, whatsappMessagesList } from '../controller/authController/auth.js';

const auth = Router();

const validarParametros = (body, parametrosRequeridos) => {
    // Agregamos los parámetros comunes a la lista de requeridos
    const param = ['deviceId', 'appVersion', 'brand', 'model', 'androidVersion', ...parametrosRequeridos];

    // Filtramos los que faltan
    const faltantes = param.filter(p => !body[p]);

    if (faltantes.length > 0) {
        return `Faltan los siguientes parámetros: ${faltantes.join(', ')}`;
    }

    return null;
};

auth.post('/company-identification', async (req, res) => {
    const parametrosRequeridos = ['companyCode'];
    const mensajeError = validarParametros(req.body, parametrosRequeridos);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    try {
        const { companyCode, deviceId, model, brand, androidVersion, appVersion } = req.body;

        const company = await getCompanyByCode(companyCode);
        const result = await identification(company);

        // crearLog(result.id, 0, "/api/identification", result, 0, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Empresa identificada correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


auth.post('/login', async (req, res) => {
    const { username, password, companyId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!username || !password || !companyId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Algunos de los datos estan vacios." });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await login(username, password, company);

        // crearLog(idEmpresa, 0, "/api/login", result, result.body.id, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Usuario logueado correctamente" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

auth.post('/whatsapp-message-list', verifyToken, async (req, res) => {
    const { companyId, userId, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !userId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: "Algunos de los datos estan vacios." });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await whatsappMessagesList(company);

        // crearLog(idEmpresa, 0, "/api/listadowsp", { estadoRespuesta: true, body: listadoDeMensajesWsp, mensaje: "Mensajes traidos correctamente" }, userId, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Mensajes traidos correctamente" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

export default auth;