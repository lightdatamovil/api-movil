import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { registerVisit, uploadImage } from '../controller/registerVisitController.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const registerVisitRoute = Router();

registerVisitRoute.post('/register', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['shipmentId', 'shipmentState', 'observation', 'latitude', 'longitude', 'recieverName', 'recieverDNI'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, shipmentId, recieverDNI, recieverName, latitude, longitude, shipmentState, observation } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await registerVisit(company, userId, shipmentId, recieverDNI, recieverName, latitude, longitude, shipmentState, observation);

        res.status(200).json({ body: result, message: "Visita registrada correctamente" });
    } catch (error) {
        logRed(`Error en register: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

registerVisitRoute.post('/upload-image', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['shipmentId', 'shipmentState', 'image', 'lineId'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, shipmentId, userId, shipmentState, image, lineId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await uploadImage(company, shipmentId, userId, shipmentState, image, lineId);

        res.status(200).json({ body: response, message: "Imagen subida correctamente" });
    } catch (error) {
        logRed(`Error en upload-image: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default registerVisitRoute;