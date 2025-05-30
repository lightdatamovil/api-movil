import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';

const map = Router();

map.post('/get-route-by-user', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'dateYYYYMMDD'],
            true
        );
        if (mensajeError) {
            logRed(`Error en get-route-by-user: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-route-by-user', message: mensajeError });
        }

        const { companyId, userId, dateYYYYMMDD } = req.body;
        const company = await getCompanyById(companyId);
        const result = await getRouteByUserId(company, userId, dateYYYYMMDD);

        logGreen(`Ruta de usuario obtenida correctamente`);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-route-by-user: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-route-by-user: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución get-route-by-user: ${endTime - startTime} ms`);
    }
});

map.post('/geolocalize', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'shipmentId', 'latitude', 'longitude'],
            true
        );
        if (mensajeError) {
            logRed(`Error en geolocalize: ${mensajeError}`);
            throw new CustomException({ title: 'Error en geolocalize', message: mensajeError });
        }

        const { companyId, shipmentId, latitude, longitude } = req.body;
        const company = await getCompanyById(companyId);
        await geolocalize(company, shipmentId, latitude, longitude);

        logGreen(`Geolocalización registrada correctamente`);
        res.status(200).json({ message: "Geolocalización registrada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en geolocalize: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en geolocalize: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución geolocalize: ${endTime - startTime} ms`);
    }
});

map.post('/save-route', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'dateYYYYMMDD', 'orders', 'distance', 'totalDelay', 'additionalRouteData'],
            true
        );
        if (mensajeError) {
            logRed(`Error en save-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en save-route', message: mensajeError });
        }

        const { companyId, userId, dateYYYYMMDD, orders, distance, totalDelay, additionalRouteData } = req.body;
        const company = await getCompanyById(companyId);
        const response = await saveRoute(
            company,
            userId,
            dateYYYYMMDD,
            orders,
            distance,
            totalDelay,
            additionalRouteData
        );

        logGreen(`Ruta guardada correctamente`);
        res.status(200).json({ body: response, message: "Ruta guardada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en save-route: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en save-route: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución save-route: ${endTime - startTime} ms`);
    }
});

export default map;
