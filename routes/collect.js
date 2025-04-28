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

const collect = Router();

collect.post("/get-route", verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'userId', 'dateYYYYMMDD'], true);
        if (mensajeError) {
            logRed(`Error en get-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-route', message: mensajeError });
        }

        const { companyId, userId, dateYYYYMMDD } = req.body;
        const company = await getCompanyById(companyId);
        const route = await getRoute(company, userId, dateYYYYMMDD);

        logGreen(`Ruta obtenida correctamente`);
        res.status(200).json({ body: route, message: "Ruta obtenida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-route: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-route: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/start-route", verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'userId'], true);
        if (mensajeError) {
            logRed(`Error en start-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en start-route', message: mensajeError });
        }

        const { companyId, userId } = req.body;
        const company = await getCompanyById(companyId);
        const startedRoute = await startCollectRoute(company, userId);

        logGreen(`Ruta comenzada correctamente`);
        res.status(200).json({ body: startedRoute, message: "Ruta comenzada correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en start-route: ${error}`);
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
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'dateYYYYMMDD',
            'operationDate',
            'additionalRouteData',
            'orders'
        ], true);
        if (mensajeError) {
            logRed(`Error en save-route: ${mensajeError}`);
            throw new CustomException({ title: 'Error en save-route', message: mensajeError });
        }

        const { companyId, userId, dateYYYYMMDD, additionalRouteData, orders } = req.body;
        const company = await getCompanyById(companyId);
        const savedRoute = await saveRoute(company, dateYYYYMMDD, userId, additionalRouteData, orders);

        logGreen(`Ruta guardada correctamente`);
        res.status(200).json({ body: savedRoute, message: "Ruta guardada correctamente" });
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
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'userId',
            'profile',
            'dateYYYYMMDD'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-collect-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-collect-details', message: mensajeError });
        }

        const { companyId, userId, profile, dateYYYYMMDD } = req.body;
        const company = await getCompanyById(companyId);
        const collectDetails = await getCollectDetails(company, userId, profile, dateYYYYMMDD);

        logGreen(`Colecta obtenida correctamente`);
        res.status(200).json({ body: collectDetails, message: "Colecta obtenida correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-collect-details: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-collect-details: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-client-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'dateYYYYMMDD',
            'clientId'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-client-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-client-details', message: mensajeError });
        }

        const { companyId, dateYYYYMMDD, clientId } = req.body;
        const company = await getCompanyById(companyId);
        const shipments = await shipmentsFromClient(company, dateYYYYMMDD, clientId);

        logGreen(`Envíos obtenidos correctamente`);
        res.status(200).json({ body: shipments, message: "Envíos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-client-details: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-client-details: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-list", verifyToken, async (req, res) => {
    const startTime = performance.now();
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

        const { companyId, userId, from, to } = req.body;
        const company = await getCompanyById(companyId);
        const list = await getCollectList(company, userId, from, to);

        logGreen(`Listado de colectas obtenido correctamente`);
        res.status(200).json({ body: list, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-collect-list: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-collect-list: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-list", verifyToken, async (req, res) => {
    const startTime = performance.now();
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

        const { companyId, from, to } = req.body;
        const company = await getCompanyById(companyId);
        const settlements = await getSettlementList(company, from, to);

        logGreen(`Listado de liquidaciones obtenido correctamente`);
        res.status(200).json({ body: settlements, message: "Listado de liquidaciones obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-settlement-list: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-settlement-list: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-details", verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, [
            'companyId',
            'settlementId'
        ], true);
        if (mensajeError) {
            logRed(`Error en get-settlement-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-settlement-details', message: mensajeError });
        }

        const { companyId, settlementId } = req.body;
        const company = await getCompanyById(companyId);
        const details = await getSettlementDetails(company, settlementId);

        logGreen(`Detalle de liquidación obtenido correctamente`);
        res.status(200).json({ body: details, message: "Detalle de liquidación obtenido correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-settlement-details: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-settlement-details: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default collect;
