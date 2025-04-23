import { Router } from 'express';
import { getCompanyById, getCompanyByCode } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { login, identification, whatsappMessagesList } from '../controller/authController.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../clases/custom_exception.js';

const auth = Router();

auth.post('/company-identification', async (req, res) => {
    const startTime = performance.now();

    try {
        const errorMessage = verifyParamaters(req.body, ['companyCode']);

        if (errorMessage) {
            logRed(`Error en company-identification: ${errorMessage}`);
            throw new CustomException({
                title: 'Error en identificacion de empresa',
                message: errorMessage
            });
        }

        const { companyCode } = req.body;

        const company = await getCompanyByCode(companyCode);

        const result = await identification(company);

        logGreen(`Empresa identificada correctamente`);
        res.status(200).json({ body: result, message: "Empresa identificada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en login: ${error} `);
            res.status(400).json(error);
        } else {
            logRed(`Error 500 en login: ${error} `);
            res.status(500).json({ title: 'Error interno del servidor', message: 'Unhandled Error', stack: error.stack });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

auth.post('/login', async (req, res) => {
    const startTime = performance.now();

    try {
        const mensajeError = verifyParamaters(req.body, ['username', 'password', 'companyId']);

        if (mensajeError) {
            throw new CustomException({
                title: 'Error en login',
                message: mensajeError
            });
        }

        const { username, password, companyId } = req.body;

        const company = await getCompanyById(companyId);

        const result = await login(username, password, company);

        logGreen(`Usuario logueado correctamente`);
        res.status(200).json({ body: result, message: "Usuario logueado correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en login: ${error} `);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500  en login: ${error} `);
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

    try {
        const company = await getCompanyById(companyId);
        const result = await whatsappMessagesList(company);

        res.status(200).json({ body: result, message: "Mensajes traidos correctamente" });
    } catch (error) {
        logRed(`Error en whatsapp - message - list: ${error.stack} `);
        if (error instanceof CustomException) {
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default auth;
