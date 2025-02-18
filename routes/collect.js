import { getCompanyById } from '../db.js';
import { Router } from 'express';
import { saveRoute, getCollectDetails, getCollectList, shipmentsFromClient, getRoute, startRoute, getSettlementDetails, getSettlementList } from '../controller/collectController/collectController.js';

const collect = Router();

collect.post("/get-route", async (req, res) => {
    const { companyId, userId, date, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !date || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const route = await getRoute(company, userId, date);

        res.status(200).json({ body: route, message: "Ruta obtenida correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/start-route", async (req, res) => {
    const { companyId, userId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const startedRoute = await startRoute(company, userId);

        // res.status(200).json({ body: startedRoute, message: "Ruta comenzada correctamente" });
        res.status(200).json("WORK IN PROGRESS");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/save-route", async (req, res) => {
    const { companyId, userId, operationDate, additionalRouteData, orders, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !operationDate || !additionalRouteData || !orders || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const savedRoute = await saveRoute(company, operationDate, userId, additionalRouteData, orders);

        res.json({ body: savedRoute, message: "Ruta guardada correctamente." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-collect-details", async (req, res) => {
    const { companyId, userId, profile, date, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !date || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const collect = await getCollectDetails(company, userId, profile, date);

        res.status(200).json({ body: collect, message: "Colecta obtenida correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-client-details", async (req, res) => {
    const { companyId, userId, profile, date, clientId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !date || !clientId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await shipmentsFromClient(company, date, clientId);

        res.status(200).json({ body: result, message: "Envíos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-collect-list", async (req, res) => {
    const { companyId, userId, profile, from, to, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !from || !to || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId)

        const collectList = await getCollectList(company, userId, from, to);

        res.status(200).json({ body: collectList, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-settlement-list", async (req, res) => {
    const { companyId, userId, profile, from, to, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !from || !to || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const settlementList = await getSettlementList(company, from, to);

        res.status(200).json({ body: settlementList, message: "Listado de liquidaciones obtenido correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-settlement-details", async (req, res) => {
    const { companyId, userId, profile, settlementId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !settlementId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const respuesta = await getSettlementDetails(company, settlementId);

        res.json({ body: respuesta, message: "Detalle de colecta obtenido correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default collect;
