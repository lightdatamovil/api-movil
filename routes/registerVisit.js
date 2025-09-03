import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { registerVisit } from '../controller/register_visit/register_visit.js';
import { uploadImage } from '../controller/register_visit/upload_image.js';
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
            throw new CustomException({ title: 'Error en register', message: mensajeError });
        }

        const company = await companiesService.getById(companyId);
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
            appVersion,
        );

        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/register", true);
        res.status(Status.ok).json({ body: result, message: "Visita registrada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/register", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/register", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
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
            throw new CustomException({ title: 'Error en upload-image', message: mensajeError });
        }

        const company = await companiesService.getById(companyId);
        const response = await uploadImage(company, shipmentId, userId, shipmentState, image, lineId);

        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/upload-image", true);
        res.status(Status.ok).json({ message: "Imagen subida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/upload-image", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/upload-image", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

export default registerVisitRoute;
