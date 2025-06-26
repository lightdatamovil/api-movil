import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';

const map = Router();

map.post('/get-route-by-user', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, dateYYYYMMDD } = req.body;
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

        const result = await getRouteByUserId(companyId, userId, dateYYYYMMDD);

        logGreen(`Ruta de usuario obtenida correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/get-route-by-user", true);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-route-by-user: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-route-by-user", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-route-by-user: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-route-by-user", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución get-route-by-user: ${endTime - startTime} ms`);
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
            logRed(`Error en geolocalize: ${mensajeError}`);
            throw new CustomException({ title: 'Error en geolocalize', message: mensajeError });
        }

        await geolocalize(companyId, shipmentId, latitude, longitude);

        logGreen(`Geolocalización registrada correctamente`);

        const result = { message: "Geolocalización registrada correctamente" };
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/geolocalize", true);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en geolocalize: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/geolocalize", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en geolocalize: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/geolocalize", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución geolocalize: ${endTime - startTime} ms`);
    }
});

map.post('/save-route', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, dateYYYYMMDD, orders, distance, totalDelay, additionalRouteData } = req.body;
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

        await saveRoute(
            companyId,
            userId,
            dateYYYYMMDD,
            orders,
            distance,
            totalDelay,
            additionalRouteData
        );

        logGreen(`Ruta guardada correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "Ruta guardada correctamente" }), "/save-route", true);
        res.status(200).json({ message: "Ruta guardada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en save-route: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/save-route", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en save-route: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/save-route", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución save-route: ${endTime - startTime} ms`);
    }
});

export default map;
