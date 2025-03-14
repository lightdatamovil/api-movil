import { Router } from 'express';
import { getCompanyById, getCompanyByCode } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { login, identification, whatsappMessagesList } from '../controller/authController.js';
import { log } from 'console';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const auth = Router();

auth.post('/company-identification', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['companyCode']);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyCode } = req.body;

    try {
        const company = await getCompanyByCode(companyCode);

        const result = await identification(company);

        // crearLog(result.id, 0, "/api/identification", result, 0, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Empresa identificada correctamente" });
    } catch (error) {
        logRed(`Error en company-identification: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

auth.post('/login', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['username', 'password', 'companyId']);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { username, password, companyId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await login(username, password, company);

        // crearLog(idEmpresa, 0, "/api/login", result, result.body.id, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Usuario logueado correctamente" });

    } catch (error) {
        logRed(`Error en login: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

auth.post('/whatsapp-message-list', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['companyId'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }
    const { companyId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await whatsappMessagesList(company);

        // crearLog(idEmpresa, 0, "/api/listadowsp", { estadoRespuesta: true, body: listadoDeMensajesWsp, mensaje: "Mensajes traidos correctamente" }, userId, deviceId, model, brand, androidVersion, appVersion);

        res.status(200).json({ body: result, message: "Mensajes traidos correctamente" });
    } catch (e) {
        logRed(`Error en whatsapp-message-list: ${e.message}`);
        res.status(500).json({ message: e.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default auth;