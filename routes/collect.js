import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';

import { saveRoute } from '../controller/collect/save_route.js';
import { getRoute } from '../controller/collect/get_route.js';

import { startCollectRoute } from '../controller/collect/start_route.js';
import { getCollectDetails } from '../controller/collect/get_collect_details.js';

import { shipmentsFromClient } from '../controller/collect/get_shipments_from_client.js';
import { getCollectList } from '../controller/collect/get_collect_list.js';

import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';

import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';
const collect = Router();

// cambiar asi nomas
collect.post("/get-route", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'userId'], true);
        if (mensajeError) {
            logRed(`Error en get-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-route', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const route = await getRoute(company, userId);

        logGreen(`Ruta obtenida correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(route), "/get-route", true);
        res.status(200).json({ body: route, message: "Ruta obtenida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-route: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-route", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-route: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-route", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/start-route", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'userId'], true);
        if (mensajeError) {
            logRed(`Error en start-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en start-route', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const startedRoute = await startCollectRoute(company, userId);

        logGreen(`Ruta comenzada correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(startedRoute), "/start-route", true);
        res.status(200).json({ body: startedRoute, message: "Ruta comenzada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en start-route: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/start-route", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en start-route: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/save-route", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, additionalRouteData, orders } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'operationDate',
            'additionalRouteData',
            'orders'
        ], true);
        if (mensajeError) {
            logRed(`Error en save-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en save-route', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const savedRoute = await saveRoute(company, userId, additionalRouteData, orders);

        logGreen(`Ruta guardada correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(savedRoute), "/save-route", true);
        res.status(200).json({ body: savedRoute, message: "Ruta guardada correctamente" });
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
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'profile',

        ], true);
        if (mensajeError) {
            logRed(`Error en get-collect-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-collect-details', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const collectDetails = await getCollectDetails(company, userId, profile);

        logGreen(`Colecta obtenida correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(collectDetails), "/get-collect-details", true);
        res.status(200).json({ body: collectDetails, message: "Colecta obtenida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-collect-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-collect-details", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-collect-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-collect-details", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-client-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, clientId } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'clientId'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-client-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-client-details', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const shipments = await shipmentsFromClient(company, clientId);

        logGreen(`Envíos obtenidos correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(shipments), "/get-client-details", true);
        res.status(200).json({ body: shipments, message: "Envíos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-client-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-client-details", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-client-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-client-details", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-list", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, from, to } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'from',
            'to'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-collect-list: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-collect-list', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const list = await getCollectList(company, userId, from, to);

        logGreen(`Listado de colectas obtenido correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(list), "/get-collect-list", true);
        res.status(200).json({ body: list, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-collect-list: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-collect-list", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-collect-list: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-collect-list", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-list", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, from, to } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'from',
            'to'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-settlement-list: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-settlement-list', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const settlements = await getSettlementList(company, from, to);

        logGreen(`Listado de liquidaciones obtenido correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(settlements), "/get-settlement-list", true);
        res.status(200).json({ body: settlements, message: "Listado de liquidaciones obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-settlement-list: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-settlement-list", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-settlement-list: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-settlement-list", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, settlementId } = req.body;
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'settlementId'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-settlement-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-settlement-details', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const details = await getSettlementDetails(company, settlementId);

        logGreen(`Detalle de liquidación obtenido correctamente`);
        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(details), "/get-settlement-details", true);
        res.status(200).json({ body: details, message: "Detalle de liquidación obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-settlement-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-settlement-details", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-settlement-details: ${error}`);
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-settlement-details", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default collect;
