import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { registerVisit } from '../controller/register_visit/register_visit.js';
import { uploadImage } from '../controller/register_visit/upload_image.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';

const registerVisitRoute = Router();

registerVisitRoute.post('/register', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const {
        companyId,
        userId,
        shipmentId,
        profile,
        recieverDNI,
        recieverName,
        latitude,
        longitude,
        shipmentState,
        observation,
        date,
        appVersion,
    } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'shipmentId',
            'shipmentState',
            'observation',
            'latitude',
            'longitude',
            'recieverName',
            'recieverDNI'
        ], true);
        if (mensajeError) {
            logRed(`Error en register: ${mensajeError}`);
            throw new CustomException({ title: 'Error en register', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const result = await registerVisit(
            company,
            userId,
            shipmentId,
            recieverDNI,
            recieverName,
            latitude,
            longitude,
            shipmentState,
            observation,
            date,
            appVersion,
        );

        logGreen(`Visita registrada correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/register", true);
        res.status(200).json({ body: result, message: "Visita registrada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en register: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/register", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en register: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/register", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución register: ${endTime - startTime} ms`);
    }
});

registerVisitRoute.post('/upload-image', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, shipmentId, userId, profile, shipmentState, image, lineId } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'shipmentId',
            'shipmentState',
            'image',
            'lineId'
        ], true);
        if (mensajeError) {
            logRed(`Error en upload-image: ${mensajeError}`);
            throw new CustomException({ title: 'Error en upload-image', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const response = await uploadImage(company, shipmentId, userId, shipmentState, image, lineId);

        logGreen(`Imagen subida correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/upload-image", true);
        res.status(200).json({ message: "Imagen subida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en upload-image: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/upload-image", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en upload-image: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/upload-image", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución upload-image: ${endTime - startTime} ms`);
    }
});

export default registerVisitRoute;
