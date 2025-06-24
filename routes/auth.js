import { Router } from 'express';
import { getCompanyById, getCompanyByCode } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { identification } from '../controller/auth/identification.js';
import { login } from '../controller/auth/login.js';
import { whatsappMessagesList } from '../controller/auth/whatsappMessagesList.js';
import { logGreen, logPurple, logRed, logYellow } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { start } from 'repl';

const auth = Router();

auth.post('/company-identification', async (req, res) => {
    const startTime = performance.now();

    const { companyCode } = req.body;
    try {
        const errorMessage = verifyParamaters(req.body, ['companyCode']);

        if (errorMessage) {
            logRed(`Error en company-identification: ${errorMessage}`);
            throw new CustomException({
                title: 'Error en identificacion de empresa',
                message: errorMessage
            });
        }


        const company = await getCompanyByCode(companyCode);

        const result = await identification(company);

        logGreen(`Empresa identificada correctamente`);
        crearLog(company.did, null, null, req.body, performance.now() - startTime, JSON.stringify(result), "/company-identification", true);
        res.status(200).json({ body: result, message: "Empresa identificada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en login: ${error} `);
            crearLog(null, null, null, req.body, performance.now() - startTime, JSON.stringify(error), "/company-identification", false);
            res.status(400).json(error);
        } else {
            logRed(`Error 500 en login: ${error} `);
            crearLog(null, null, null, req.body, performance.now() - startTime, JSON.stringify(error.message), "/company-identification", false);
            res.status(500).json({ title: 'Error interno del servidor', message: 'Unhandled Error', stack: error.stack });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

auth.post('/login', async (req, res) => {
    const startTime = performance.now();

    const { username, password, companyId } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, ['username', 'password', 'companyId']);

        if (mensajeError) {
            throw new CustomException({
                title: 'Error en login',
                message: mensajeError
            });
        }

        const company = await getCompanyById(companyId);

        const result = await login(username, password, company);

        logGreen(`Usuario logueado correctamente`);
        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/login", true);
        res.status(200).json({ body: result, message: "Usuario logueado correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error), "/login", false);
            logRed(`Error 400 en login: ${error} `);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error.message), "/login", false);
            logRed(`Error 500 en login: ${error} `);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
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
    logYellow(`Tiempo de ejecución: ${performance.now() - startTime} ms - Inicio de whatsapp-message-list`);
    try {
        const company = await getCompanyById(companyId);
        logYellow(`${performance.now() - startTime} ms traje company`);
        const result = await whatsappMessagesList(company, startTime);
        crearLog(companyId, null, null, req.body, performance.now() - startTime, JSON.stringify(result), "/whatsapp-message-list", true);
        res.status(200).json({ body: result, message: "Mensajes traidos correctamente" });
    } catch (error) {
        logRed(`Error en whatsapp - message - list: ${error.stack} `);
        if (error instanceof CustomException) {
            crearLog(companyId, null, null, req.body, performance.now() - startTime, JSON.stringify(error), "/whatsapp-message-list", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, null, null, req.body, performance.now() - startTime, JSON.stringify(error.message), "/whatsapp-message-list", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default auth;
