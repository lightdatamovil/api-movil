import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { getSettlementShipmentDetails } from '../controller/settlements/get_settlement_shipment_details.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';

const settlements = Router();

settlements.post('/settlement-list', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, from, to } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'from', 'to'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en settlement-list', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const list = await getSettlementList(company, userId, from, to);
        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/settlement-list", true);
        res.status(200).json({ body: list, message: 'Listado de liquidaciones obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error), "/settlement-list", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error.message), "/settlement-list", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

settlements.post('/settlement-details', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, settlementId } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'settlementId'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en settlement-details', message: mensajeError });
        }
        const company = await getCompanyById(companyId);
        const details = await getSettlementDetails(company, settlementId);

        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/settlement-details", true);
        res.status(200).json({ body: details, message: 'Detalle de liquidación obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error), "/settlement-details", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error.message), "/settlement-details", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

settlements.post('/settlement-shipment-details', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en settlement-shipment-details', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const shipments = await getSettlementShipmentDetails(company, userId);

        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/settlement-shipment-details", true);
        res.status(200).json({ body: shipments, message: 'Detalle de envíos de liquidación obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error), "/settlement-shipment-details", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error.message), "/settlement-shipment-details", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
    }
});

export default settlements;
