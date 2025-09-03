import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';

const map = Router();

map.post('/get-route-by-user', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en get-route-by-user', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const result = await getRouteByUserId(company, userId);

        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/get-route-by-user", true);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-route-by-user", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-route-by-user", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

map.post('/geolocalize', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, profile, userId, shipmentId, latitude, longitude } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'shipmentId', 'latitude', 'longitude'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en geolocalize', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        await geolocalize(company, shipmentId, latitude, longitude);


        const result = { message: "Geolocalización registrada correctamente" };
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/geolocalize", true);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/geolocalize", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/geolocalize", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

map.post('/save-route', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, orders, distance, totalDelay, additionalRouteData } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'orders', 'distance', 'totalDelay', 'additionalRouteData'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en save-route', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        await saveRoute(
            company,
            userId,
            orders,
            distance,
            totalDelay,
            additionalRouteData
        );

        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "Ruta guardada correctamente" }), "/save-route", true);
        res.status(200).json({ message: "Ruta guardada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/save-route", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/save-route", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

export default map;
