import { getCompanyById } from '../db.js';
import { Router } from 'express';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { saveRoute, getCollectDetails, getCollectList, shipmentsFromClient, getRoute, startRoute, getSettlementDetails, getSettlementList } from '../controller/collectController.js';
import { logRed } from '../src/funciones/logsCustom.js';

const collect = Router();

collect.post("/get-route", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const route = await getRoute(company, userId);

        res.status(200).json({ body: route, message: "Ruta obtenida correctamente" });
    } catch (error) {
        logRed(`Error en get-route: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/start-route", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const startedRoute = await startRoute(company, userId);

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ body: startedRoute, message: "Ruta comenzada correctamente" });
    } catch (error) {
        logRed(`Error en start-route: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/save-route", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['operationDate', 'additionalRouteData', 'orders'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, operationDate, additionalRouteData, orders } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const savedRoute = await saveRoute(company, operationDate, userId, additionalRouteData, orders);

        res.json({ body: savedRoute, message: "Ruta guardada correctamente." });
    } catch (error) {
        logRed(`Error en save-route: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-details", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['date'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, profile, date } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const collect = await getCollectDetails(company, userId, profile, date);

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ body: collect, message: "Colecta obtenida correctamente" });
    } catch (error) {
        logRed(`Error en get-collect-details: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-client-details", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['date', 'clientId'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, date, clientId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await shipmentsFromClient(company, date, clientId);

        res.status(200).json({ body: result, message: "Envíos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en get-client-details: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-collect-list", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['from', 'to', true]);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, from, to } = req.body;

    try {
        const company = await getCompanyById(companyId)

        const collectList = await getCollectList(company, userId, from, to);

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ body: collectList, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        logRed(`Error en get-collect-list: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-list", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['from', 'to'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, from, to, } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const settlementList = await getSettlementList(company, from, to);

        res.status(200).json({ body: settlementList, message: "Listado de liquidaciones obtenido correctamente" });
    } catch (error) {
        logRed(`Error en get-settlement-list: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

collect.post("/get-settlement-details", async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['settlementId'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }
    const { companyId, settlementId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const respuesta = await getSettlementDetails(company, settlementId);

        res.json({ body: respuesta, message: "Detalle de colecta obtenido correctamente" });
    } catch (error) {
        logRed(`Error en get-settlement-details: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default collect;
