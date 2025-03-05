import { getCompanyById } from '../db.js';
import { Router } from 'express';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { saveRoute, getCollectDetails, getCollectList, shipmentsFromClient, getRoute, startRoute, getSettlementDetails, getSettlementList } from '../controller/collectController.js';

const collect = Router();

collect.post("/get-route", async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
});

collect.post("/start-route", async (req, res) => {
    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId } = req.body;

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
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-collect-details", async (req, res) => {

    const mensajeError = verifyParamaters(req.body, ['date'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, profile, date } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const collect = await getCollectDetails(company, userId, profile, date);

        res.status(200).json({ body: collect, message: "Colecta obtenida correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-client-details", async (req, res) => {

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
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-collect-list", async (req, res) => {

    const mensajeError = verifyParamaters(req.body, ['from', 'to', true]);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, from, to } = req.body;

    try {
        const company = await getCompanyById(companyId)

        const collectList = await getCollectList(company, userId, from, to);

        res.status(200).json({ body: collectList, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-settlement-list", async (req, res) => {

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
        res.status(500).json({ message: error.message });
    }
});

collect.post("/get-settlement-details", async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
});

export default collect;
