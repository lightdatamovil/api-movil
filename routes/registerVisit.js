import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { registerVisit, uploadImage } from '../controller/registerVisitController.js';

const registerVisitRoute = Router();

registerVisitRoute.post('/register', async (req, res) => {
    const mensajeError = verifyParamaters(req.body, ['shipmentId', 'shipmentState', 'observation', 'latitude', 'longitude', 'recieverName', 'recieverDNI'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, shipmentId, recieverDNI, recieverName, latitude, longitude, shipmentState, observation } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await registerVisit(company, userId, shipmentId, recieverDNI, recieverName, latitude, longitude, shipmentState, observation);

        return res.status(200).json({ body: result, message: "Visita registrada correctamente" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

registerVisitRoute.post('/upload-image', async (req, res) => {

    const mensajeError = verifyParamaters(req.body, ['shipmentId', 'shipmentState', 'image'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, shipmentId, userId, shipmentState, image } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await uploadImage(company, shipmentId, userId, shipmentState, image);

        res.status(200).json({ body: response, message: "Imagen subida correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default registerVisitRoute;