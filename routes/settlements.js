import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { getSettlementShipmentDetails } from '../controller/settlements/get_settlement_shipment_details.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';

const settlements = Router();

settlements.post('/settlement-list', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'from', 'to'],
            true
        );
        if (mensajeError) {
            logRed(`Error en settlement-list: ${mensajeError}`);
            throw new CustomException({ title: 'Error en settlement-list', message: mensajeError });
        }

        const { companyId, userId, from, to } = req.body;
        const company = await getCompanyById(companyId);
        const list = await getSettlementList(company, userId, from, to);

        logGreen(`Listado de liquidaciones obtenido correctamente`);
        res.status(200).json({ body: list, message: 'Listado de liquidaciones obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en settlement-list: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en settlement-list: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución settlement-list: ${endTime - startTime} ms`);
    }
});

settlements.post('/settlement-details', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'settlementId'],
            true
        );
        if (mensajeError) {
            logRed(`Error en settlement-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en settlement-details', message: mensajeError });
        }

        const { companyId, settlementId } = req.body;
        const company = await getCompanyById(companyId);
        const details = await getSettlementDetails(company, settlementId);

        logGreen(`Detalle de liquidación obtenido correctamente`);
        res.status(200).json({ body: details, message: 'Detalle de liquidación obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en settlement-details: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en settlement-details: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución settlement-details: ${endTime - startTime} ms`);
    }
});

settlements.post('/settlement-shipment-details', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId'],
            true
        );
        if (mensajeError) {
            logRed(`Error en settlement-shipment-details: ${mensajeError}`);
            throw new CustomException({ title: 'Error en settlement-shipment-details', message: mensajeError });
        }

        const { companyId, userId } = req.body;
        const company = await getCompanyById(companyId);
        const shipments = await getSettlementShipmentDetails(company, userId);

        logGreen(`Detalle de envíos de liquidación obtenido correctamente`);
        res.status(200).json({ body: shipments, message: 'Detalle de envíos de liquidación obtenido correctamente' });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en settlement-shipment-details: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en settlement-shipment-details: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución settlement-shipment-details: ${endTime - startTime} ms`);
    }
});

export default settlements;
